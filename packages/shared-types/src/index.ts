export type ISODate = string;
export type ISODateTime = string;

export type PatientGender = 'male' | 'female' | 'other' | 'unknown';

export type PatientIdentifier = {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  system: string;
  value: string;
  type: {
    coding: Array<{
      system: string;
      code: 'CCCD' | 'BHYT' | 'MR' | 'OTHER';
      display?: string;
    }>;
    text?: string;
  };
};

export type ContactPoint = {
  system: 'phone' | 'email' | 'fax' | 'url' | 'sms' | 'other';
  value: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
};

export interface PatientIdentity {
  identifiers: PatientIdentifier[];
  name: {
    text: string;
    family?: string;
    given?: string[];
  };
  birthDate?: ISODate;
  gender: PatientGender;
  telecom: ContactPoint[];
  address?: {
    text?: string;
    line?: string[];
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface Money {
  value: number;
  currency: string;
}

export interface TimeSlot {
  slotId: string;
  startTime: ISODateTime;
  endTime: ISODateTime;
  isAvailable: boolean;
  price: Money;
}

export type AppointmentStatus =
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface BookingRequestDTO {
  nationalId: string;
  fullName: string;
  phone: string;
  doctorId: string;
  slotId: string;
  timeSlot: Pick<TimeSlot, 'startTime' | 'endTime'>;
  // Reuse across retries so the API can return the original result, not create another booking.
  idempotencyKey: string;
  preliminaryReason?: string;
}

export interface BookingResponseDTO {
  appointmentId: string;
  status: AppointmentStatus;
  slot: Pick<TimeSlot, 'startTime' | 'endTime' | 'price'>;
  // Opaque client token; never expose the underlying Redis key to the browser.
  reservationToken: string;
  holdExpiresAt: ISODateTime;
}

export interface PaymentUrlResponseDTO {
  appointmentId: string;
  paymentUrl: string;
  expiresAt: ISODateTime;
}

export interface PaymentCallbackResponseDTO {
  appointmentId: string;
  status: 'CONFIRMED' | 'DECLINED';
}

export type FHIRAppointmentStatus =
  | 'proposed'
  | 'pending'
  | 'booked'
  | 'arrived'
  | 'fulfilled'
  | 'cancelled'
  | 'noshow'
  | 'entered-in-error'
  | 'checked-in'
  | 'waitlist';

export interface FHIRReference {
  reference: string;
  display?: string;
}

export interface FHIRAppointmentResource {
  resourceType: 'Appointment';
  id: string;
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status: FHIRAppointmentStatus;
  start: ISODateTime;
  end: ISODateTime;
  description?: string;
  participant: Array<{
    actor: FHIRReference;
    required?: 'required' | 'optional' | 'information-only';
    status: 'accepted' | 'declined' | 'tentative' | 'needs-action';
  }>;
  // Carries internal workflow states that do not map one-to-one to FHIR R4 statuses.
  extension?: Array<{
    url: string;
    valueCode: AppointmentStatus;
  }>;
}

export interface FHIRBundleAppointment {
  resourceType: 'Bundle';
  id: string;
  type: 'transaction' | 'batch' | 'collection';
  timestamp?: ISODateTime;
  entry: Array<{
    fullUrl?: string;
    resource: FHIRAppointmentResource;
    request?: {
      method: 'POST' | 'PUT';
      url: string;
    };
  }>;
}

export interface DoctorProfileDTO {
  doctorId: string;
  fullName: string;
  title?: string;
  biography?: string;
  department: {
    departmentId: string;
    name: string;
  };
  hospital: {
    hospitalId: string;
    code: string;
    name: string;
    province: string;
    address: string;
    timeZone: string;
  };
  baseConsultationFee: Money;
  availableSlots: TimeSlot[];
}