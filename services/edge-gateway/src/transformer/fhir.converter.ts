import { randomUUID } from 'node:crypto';
import type { PatientIdentity } from '@packages/shared-types';

type FhirResource = Record<string, unknown> & {
  resourceType: string;
  id: string;
};

interface BundleEntry {
  fullUrl: string;
  resource: FhirResource;
  request: { method: 'POST'; url: string };
}

export interface FhirTransactionBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'transaction';
  timestamp: string;
  entry: BundleEntry[];
}

interface Hl7Segment {
  name: string;
  fields: string[];
}

interface ObservationGroup {
  obr?: Hl7Segment;
  observations: FhirResource[];
}

const LOINC_CODES: Record<string, { code: string; display: string }> = {
  CBC: { code: '58410-2', display: 'Complete blood count panel' },
  WBC: { code: '6690-2', display: 'Leukocytes [#/volume] in Blood' },
  RBC: { code: '789-8', display: 'Erythrocytes [#/volume] in Blood' },
  HGB: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
  HEMOGLOBIN: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
  HCT: { code: '4544-3', display: 'Hematocrit [Volume Fraction] of Blood' },
  PLT: { code: '777-3', display: 'Platelets [#/volume] in Blood' },
  ALT: { code: '1742-6', display: 'Alanine aminotransferase [Enzymatic activity/volume] in Serum or Plasma' },
  AST: { code: '1920-8', display: 'Aspartate aminotransferase [Enzymatic activity/volume] in Serum or Plasma' },
  TBIL: { code: '1975-2', display: 'Bilirubin.total [Mass/volume] in Serum or Plasma' },
  TSH: { code: '3016-3', display: 'Thyrotropin [Units/volume] in Serum or Plasma' },
  CRP: { code: '1988-5', display: 'C reactive protein [Mass/volume] in Serum or Plasma' },
  HBA1C: { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood' },
  GLU: { code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma' },
  GLUCOSE: { code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma' },
  NA: { code: '2951-2', display: 'Sodium [Moles/volume] in Serum or Plasma' },
  K: { code: '2823-3', display: 'Potassium [Moles/volume] in Serum or Plasma' },
  CREA: { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
  CR: { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
};

const IDENTIFIER_SYSTEM = 'https://healthcare.example/fhir/identifier';
const IDENTIFIER_TYPE_SYSTEM = 'https://healthcare.example/fhir/identifier-type';
const LAB_CODE_SYSTEM = 'https://healthcare.example/fhir/lab-code';

function field(segment: Hl7Segment | undefined, index: number): string {
  return segment?.fields[index] ?? '';
}

function component(value: string, index: number): string {
  return value.split('^')[index] ?? '';
}

function parseDate(value: string): string | undefined {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  if (!match) {
    return undefined;
  }
  const date = `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? undefined : date;
}

function parseDateTime(value: string): string | undefined {
  const match = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?(?:\.(\d{1,4}))?([+-]\d{4})?$/.exec(value);
  if (!match) {
    return undefined;
  }

  const [, year, month, day, hour = '00', minute = '00', second = '00', fraction, offset] = match;
  const zone = offset ? `${offset.slice(0, 3)}:${offset.slice(3)}` : 'Z';
  const milliseconds = fraction ? `.${fraction.padEnd(3, '0').slice(0, 3)}` : '';
  const parsed = `${year}-${month}-${day}T${hour}:${minute}:${second}${milliseconds}${zone}`;
  return Number.isNaN(Date.parse(parsed)) ? undefined : parsed;
}

function parseGender(value: string): PatientIdentity['gender'] {
  switch (value.toUpperCase()) {
    case 'M':
    case 'MALE':
      return 'male';
    case 'F':
    case 'FEMALE':
      return 'female';
    case 'O':
      return 'other';
    default:
      return 'unknown';
  }
}

function parseIdentifierType(value: string): 'CCCD' | 'BHYT' | 'MR' | 'OTHER' {
  switch (value.toUpperCase()) {
    case 'CCCD':
    case 'CCD':
    case 'NID':
    case 'SS':
      return 'CCCD';
    case 'BHYT':
    case 'VN':
      return 'BHYT';
    case 'MR':
    case 'MRN':
    case 'PI':
      return 'MR';
    default:
      return 'OTHER';
  }
}

function parsePatient(pid: Hl7Segment): PatientIdentity {
  const identifiers: PatientIdentity['identifiers'] = [];
  const rawIds = field(pid, 3).split('~').filter(Boolean);
  const nationalId = field(pid, 19);
  if (nationalId) {
    identifiers.push({
      use: 'official',
      system: `${IDENTIFIER_SYSTEM}/cccd`,
      value: nationalId,
      type: {
        coding: [{ system: IDENTIFIER_TYPE_SYSTEM, code: 'CCCD', display: 'Vietnamese citizen ID' }],
        text: 'CCCD',
      },
    });
  }

  for (const rawId of rawIds) {
    const value = component(rawId, 0);
    if (!value || (nationalId && value === nationalId)) {
      continue;
    }
    const idTypeComponent = component(rawId, 4);
    const typeCode = parseIdentifierType(idTypeComponent);
    const inferredType = typeCode === 'OTHER' && !idTypeComponent && identifiers.length === 0
      ? 'CCCD'
      : typeCode;
    const code = inferredType;
    identifiers.push({
      use: code === 'CCCD' || code === 'BHYT' ? 'official' : 'usual',
      system: `${IDENTIFIER_SYSTEM}/${code.toLowerCase()}`,
      value,
      type: {
        coding: [{
          system: IDENTIFIER_TYPE_SYSTEM,
          code,
          ...(code === 'CCCD' ? { display: 'Vietnamese citizen ID' } : {}),
        }],
        text: code,
      },
    });
  }

  const names = field(pid, 5).split('~')[0]?.split('^') ?? [];
  const family = names[0] ?? '';
  const given = names.slice(1, 3).filter(Boolean);
  const nameText = [...given, family].filter(Boolean).join(' ');
  const phones = field(pid, 13).split('~').map((phone) => component(phone, 0)).filter(Boolean);
  const address = field(pid, 11).split('^');
  const identity: PatientIdentity = {
    identifiers,
    name: { text: nameText || 'Unknown', ...(family ? { family } : {}), ...(given.length ? { given } : {}) },
    gender: parseGender(field(pid, 8)),
    telecom: phones.map((value) => ({ system: 'phone', value })),
  };
  const birthDate = parseDate(field(pid, 7));
  if (birthDate) {
    identity.birthDate = birthDate;
  }
  if (address.some(Boolean)) {
    identity.address = {
      text: address.filter(Boolean).join(', '),
      ...(address[0] ? { line: [address[0]] } : {}),
      ...(address[2] ? { city: address[2] } : {}),
      ...(address[3] ? { province: address[3] } : {}),
      ...(address[5] ? { country: address[5] } : {}),
    };
  }
  return identity;
}

function makePatient(identity: PatientIdentity, id: string): FhirResource {
  return {
    resourceType: 'Patient',
    id,
    ...(identity.identifiers.length
      ? {
        identifier: identity.identifiers.map((identifier) => ({
          use: identifier.use,
          system: identifier.system,
          value: identifier.value,
          type: {
            coding: identifier.type.coding.map((coding) => ({
              system: coding.system,
              code: coding.code,
              ...(coding.display ? { display: coding.display } : {}),
            })),
            ...(identifier.type.text ? { text: identifier.type.text } : {}),
          },
        })),
      }
      : {}),
    name: [{
      text: identity.name.text,
      ...(identity.name.family ? { family: identity.name.family } : {}),
      ...(identity.name.given ? { given: identity.name.given } : {}),
    }],
    gender: identity.gender,
    ...(identity.birthDate ? { birthDate: identity.birthDate } : {}),
    ...(identity.telecom.length ? { telecom: identity.telecom } : {}),
    ...(identity.address ? { address: [identity.address] } : {}),
  };
}

function labCoding(value: string): { system: string; code: string; display?: string } {
  const code = component(value, 0);
  if (!code) {
    return { system: LAB_CODE_SYSTEM, code: 'unknown' };
  }
  const source = component(value, 2).toUpperCase();
  const loinc = LOINC_CODES[code.toUpperCase()];
  if (loinc) {
    return { system: 'http://loinc.org', code: loinc.code, display: loinc.display };
  }
  if (source === 'LN' || source === 'LOINC') {
    return { system: 'http://loinc.org', code, ...(component(value, 1) ? { display: component(value, 1) } : {}) };
  }
  return { system: LAB_CODE_SYSTEM, code, ...(component(value, 1) ? { display: component(value, 1) } : {}) };
}

function makeObservation(obx: Hl7Segment, patientId: string): FhirResource {
  const id = randomUUID();
  const codingValue = field(obx, 3);
  const coding = labCoding(codingValue);
  const value = field(obx, 5).split('~')[0] ?? '';
  const numericValue = Number(value);
  const resultValue = value !== '' && Number.isFinite(numericValue)
    ? { valueQuantity: { value: numericValue, ...(field(obx, 6) ? { unit: field(obx, 6) } : {}) } }
    : value
      ? { valueString: value }
      : {};
  const statusCode = field(obx, 11).toUpperCase();
  const status = statusCode === 'F' ? 'final'
    : statusCode === 'C' ? 'corrected'
    : statusCode === 'P' ? 'preliminary'
      : statusCode === 'X' ? 'cancelled'
        : 'unknown';
  const effective = parseDateTime(field(obx, 14));

  return {
    resourceType: 'Observation',
    id,
    status,
    category: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
        code: 'laboratory',
      }],
    }],
    code: {
      coding: [coding],
      ...(component(codingValue, 1) ? { text: component(codingValue, 1) } : {}),
    },
    subject: { reference: `urn:uuid:${patientId}` },
    ...(effective ? { effectiveDateTime: effective } : {}),
    ...resultValue,
    ...(field(obx, 7) ? { referenceRange: [{ text: field(obx, 7) }] } : {}),
    ...(field(obx, 8) ? { interpretation: [{ text: field(obx, 8) }] } : {}),
  };
}

function appointmentStatus(value: string): string {
  switch (value.toLowerCase()) {
    case 'booked':
    case 'b':
      return 'booked';
    case 'arrived':
    case 'checked-in':
      return 'arrived';
    case 'fulfilled':
    case 'complete':
      return 'fulfilled';
    case 'cancelled':
    case 'c':
      return 'cancelled';
    case 'noshow':
    case 'no-show':
      return 'noshow';
    default:
      return 'pending';
  }
}

export class FhirConverter {
  convert(rawMessage: string): FhirTransactionBundle {
    const normalized = rawMessage.replace(/\r\n/g, '\r').replace(/\n/g, '\r').trim();
    if (!normalized.startsWith('MSH')) {
      throw new Error('HL7 message must start with an MSH segment');
    }
    const separator = normalized[3];
    if (!separator) {
      throw new Error('HL7 message is missing the field separator');
    }
    const segments: Hl7Segment[] = normalized.split('\r').filter(Boolean).map((line) => {
      const fields = line.split(separator);
      return { name: fields[0] ?? '', fields };
    });
    const msh = segments.find((segment) => segment.name === 'MSH');
    const messageType = field(msh, 8);
    if (!messageType) {
      throw new Error('HL7 message is missing MSH-9 message type');
    }

    const pid = segments.find((segment) => segment.name === 'PID');
    if (!pid) {
      throw new Error('HL7 message does not contain a PID segment');
    }

    const patientId = randomUUID();
    const entries: BundleEntry[] = [];
    const addEntry = (resource: FhirResource): void => {
      entries.push({
        fullUrl: `urn:uuid:${resource.id}`,
        resource,
        request: { method: 'POST', url: resource.resourceType },
      });
    };

    addEntry(makePatient(parsePatient(pid), patientId));

    const groups: ObservationGroup[] = [];
    for (const segment of segments) {
      if (segment.name === 'OBR') {
        groups.push({ obr: segment, observations: [] });
      } else if (segment.name === 'OBX') {
        if (groups.length === 0) {
          groups.push({ observations: [] });
        }
        groups[groups.length - 1]?.observations.push(makeObservation(segment, patientId));
      }
    }
    for (const group of groups) {
      for (const observation of group.observations) {
        addEntry(observation);
      }
      if (group.obr || group.observations.length) {
        const reportId = randomUUID();
        const reportCode = field(group.obr, 4);
        const reportStatusCode = field(group.obr, 25).toUpperCase();
        const reportStatus = reportStatusCode === 'F' ? 'final'
          : reportStatusCode === 'C' ? 'corrected'
          : reportStatusCode === 'P' ? 'preliminary'
            : reportStatusCode === 'X' ? 'cancelled'
              : 'unknown';
        const reportDate = parseDateTime(field(group.obr, 7));
        addEntry({
          resourceType: 'DiagnosticReport',
          id: reportId,
          status: reportStatus,
          code: {
            coding: [labCoding(reportCode)],
            ...(component(reportCode, 1) ? { text: component(reportCode, 1) } : {}),
          },
          subject: { reference: `urn:uuid:${patientId}` },
          ...(reportDate ? { effectiveDateTime: reportDate } : {}),
          ...(group.observations.length
            ? {
              result: group.observations.map((observation) => ({
                reference: `urn:uuid:${observation.id}`,
              })),
            }
            : {}),
        });
      }
    }

    for (const segment of segments.filter((item) => item.name === 'SCH')) {
      const timing = field(segment, 11).split('^');
      const start = parseDateTime(timing[3] ?? timing[0] ?? '');
      const end = parseDateTime(timing[4] ?? timing[1] ?? '');
      if (!start || !end || Date.parse(end) <= Date.parse(start)) {
        throw new Error('HL7 SCH segment must include valid appointment start and end times');
      }
      const appointmentId = randomUUID();
      addEntry({
        resourceType: 'Appointment',
        id: appointmentId,
        ...(field(segment, 1)
          ? { identifier: [{ system: `${IDENTIFIER_SYSTEM}/appointment`, value: field(segment, 1) }] }
          : {}),
        status: appointmentStatus(field(segment, 25)),
        start,
        end,
        ...(field(segment, 7) ? { description: field(segment, 7) } : {}),
        participant: [{
          actor: { reference: `urn:uuid:${patientId}` },
          status: 'accepted',
          required: 'required',
        }],
      });
    }

    if (entries.length === 1 && !messageType.startsWith('ADT')) {
      throw new Error(`HL7 message type ${messageType} contains no supported clinical data`);
    }

    return {
      resourceType: 'Bundle',
      id: randomUUID(),
      type: 'transaction',
      timestamp: new Date().toISOString(),
      entry: entries,
    };
  }
}
