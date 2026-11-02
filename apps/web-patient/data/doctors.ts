export interface DoctorProfile {
  doctorId: string;
  slug: string;
  fullName: string;
  title: string;
  position: string;
  department: string;
  hospitalName: string;
  experienceYears: number;
  baseConsultationFee: number;
  avatarUrl: string;
  education: string[];
  specializations: string[];
  biography: string;
  schedule: Record<string, string>;
}

export const doctors: DoctorProfile[] = [
  {
    doctorId: '44fdd2ae-c7de-4e51-94a9-39d9cac9a452',
    slug: 'nguyen-minh-khoi',
    fullName: 'Nguyễn Minh Khôi',
    title: 'BS.CKII',
    position: 'Trưởng khoa Nội Tim mạch',
    department: 'Tim mạch',
    hospitalName: 'Bệnh viện Đa khoa CarePlus',
    experienceYears: 18,
    baseConsultationFee: 350000,
    avatarUrl:
      'https://ui-avatars.com/api/?name=Nguy%E1%BB%85n+Minh+Kh%C3%B4i&background=0d9488&color=fff&size=200',
    education: [
      'Tốt nghiệp Bác sĩ Đa khoa – Đại học Y Dược TP.HCM (2006)',
      'Chuyên khoa II Nội Tim mạch – Đại học Y Dược TP.HCM (2012)',
      'Fellowship Tim mạch can thiệp – Singapore General Hospital (2014–2015)',
      'Chứng chỉ Siêu âm tim nâng cao – Hội Tim mạch Châu Âu (ESC)',
    ],
    specializations: [
      'Tim mạch can thiệp',
      'Suy tim mạn tính',
      'Rối loạn nhịp tim',
      'Bệnh mạch vành',
      'Tăng huyết áp kháng trị',
    ],
    biography:
      'BS.CKII Nguyễn Minh Khôi là chuyên gia đầu ngành về Tim mạch can thiệp với 18 năm kinh nghiệm lâm sàng. Ông từng tu nghiệp tại Singapore General Hospital và hiện giữ vai trò Trưởng khoa Nội Tim mạch tại Bệnh viện Đa khoa CarePlus. Bác sĩ Khôi được đồng nghiệp và bệnh nhân đánh giá cao nhờ chuyên môn vững vàng và phong cách điều trị tận tâm.',
    schedule: {
      'Thứ Hai': '08:00 – 12:00',
      'Thứ Ba': '13:30 – 17:00',
      'Thứ Tư': '08:00 – 12:00',
      'Thứ Năm': '13:30 – 17:00',
      'Thứ Sáu': '08:00 – 12:00',
    },
  },
  {
    doctorId: '6a55d62e-d2ec-4dca-b5f1-bdc85c81d771',
    slug: 'tran-thi-thu-ha',
    fullName: 'Trần Thị Thu Hà',
    title: 'PGS.TS.BS',
    position: 'Phó khoa Hô hấp',
    department: 'Hô hấp',
    hospitalName: 'Bệnh viện Đa khoa CarePlus',
    experienceYears: 20,
    baseConsultationFee: 450000,
    avatarUrl:
      'https://ui-avatars.com/api/?name=Tr%E1%BA%A7n+Th%E1%BB%8B+Thu+H%C3%A0&background=0d9488&color=fff&size=200',
    education: [
      'Tốt nghiệp Bác sĩ Đa khoa – Đại học Y Hà Nội (2004)',
      'Tiến sĩ Y khoa chuyên ngành Hô hấp – Đại học Y Hà Nội (2011)',
      'Tu nghiệp Nội soi Phế quản – Đại học Juntendo, Nhật Bản (2013)',
      'Phó Giáo sư Y học – Hội đồng Chức danh Giáo sư Nhà nước (2019)',
    ],
    specializations: [
      'Hen phế quản',
      'Bệnh phổi tắc nghẽn mạn tính (COPD)',
      'Ung thư phổi',
      'Nội soi phế quản can thiệp',
      'Lao phổi và nhiễm trùng hô hấp',
    ],
    biography:
      'PGS.TS.BS Trần Thị Thu Hà là chuyên gia hàng đầu trong lĩnh vực Hô hấp với hơn 20 năm kinh nghiệm nghiên cứu và điều trị. Bà hoàn thành chương trình tu nghiệp tại Đại học Juntendo, Nhật Bản và đã công bố nhiều công trình khoa học trên các tạp chí y khoa quốc tế. Hiện bà đảm nhiệm vị trí Phó khoa Hô hấp tại Bệnh viện Đa khoa CarePlus.',
    schedule: {
      'Thứ Hai': '13:30 – 17:00',
      'Thứ Ba': '08:00 – 12:00',
      'Thứ Tư': '13:30 – 17:00',
      'Thứ Năm': '08:00 – 12:00',
      'Thứ Sáu': '13:30 – 17:00',
      'Thứ Bảy': '08:00 – 11:30',
    },
  },
  {
    doctorId: '34a11c50-c7e7-4e5e-8aca-24a4b0d7b91f',
    slug: 'le-hoang-nam',
    fullName: 'Lê Hoàng Nam',
    title: 'BS.CKII',
    position: 'Trưởng khoa Tiêu hóa',
    department: 'Tiêu hóa',
    hospitalName: 'Bệnh viện Đa khoa CarePlus',
    experienceYears: 15,
    baseConsultationFee: 400000,
    avatarUrl:
      'https://ui-avatars.com/api/?name=L%C3%AA+Ho%C3%A0ng+Nam&background=0d9488&color=fff&size=200',
    education: [
      'Tốt nghiệp Bác sĩ Đa khoa – Đại học Y Dược TP.HCM (2009)',
      'Chuyên khoa II Nội Tiêu hóa – Đại học Y Dược TP.HCM (2015)',
      'Chứng chỉ Nội soi Tiêu hóa nâng cao – Bệnh viện Chợ Rẫy (2016)',
      'Khóa đào tạo ERCP – Trung tâm Y khoa Seoul, Hàn Quốc (2018)',
    ],
    specializations: [
      'Nội soi tiêu hóa can thiệp',
      'Bệnh lý gan mật',
      'Viêm loét dạ dày – tá tràng',
      'Bệnh lý đại tràng',
      'Trào ngược dạ dày thực quản (GERD)',
    ],
    biography:
      'BS.CKII Lê Hoàng Nam là chuyên gia Tiêu hóa có 15 năm kinh nghiệm, đặc biệt thành thạo kỹ thuật nội soi can thiệp và ERCP. Ông đã hoàn thành khóa đào tạo chuyên sâu tại Hàn Quốc và hiện là Trưởng khoa Tiêu hóa tại Bệnh viện Đa khoa CarePlus. Bác sĩ Nam nổi tiếng với phong cách giải thích bệnh tình rõ ràng, giúp bệnh nhân yên tâm trong suốt quá trình điều trị.',
    schedule: {
      'Thứ Hai': '08:00 – 12:00',
      'Thứ Ba': '08:00 – 12:00',
      'Thứ Tư': '13:30 – 17:00',
      'Thứ Năm': '08:00 – 12:00',
      'Thứ Sáu': '13:30 – 17:00',
    },
  },
  {
    doctorId: 'eb414570-802e-4e81-8b78-8f44d95de663',
    slug: 'pham-ngoc-mai',
    fullName: 'Phạm Ngọc Mai',
    title: 'ThS.BS',
    position: 'Bác sĩ Nhi khoa',
    department: 'Nhi khoa',
    hospitalName: 'Bệnh viện Đa khoa CarePlus',
    experienceYears: 12,
    baseConsultationFee: 350000,
    avatarUrl:
      'https://ui-avatars.com/api/?name=Ph%E1%BA%A1m+Ng%E1%BB%8Dc+Mai&background=0d9488&color=fff&size=200',
    education: [
      'Tốt nghiệp Bác sĩ Đa khoa – Đại học Y Dược TP.HCM (2012)',
      'Thạc sĩ Y học chuyên ngành Nhi khoa – Đại học Y Dược TP.HCM (2016)',
      'Chứng chỉ Hồi sức Nhi sơ sinh – Bệnh viện Nhi Đồng 1 (2017)',
      'Khóa đào tạo Dị ứng - Miễn dịch Nhi – Đại học Mahidol, Thái Lan (2019)',
    ],
    specializations: [
      'Nhi tổng quát',
      'Hô hấp nhi',
      'Dị ứng – miễn dịch nhi',
      'Dinh dưỡng trẻ em',
      'Hồi sức sơ sinh',
    ],
    biography:
      'ThS.BS Phạm Ngọc Mai là bác sĩ Nhi khoa giàu kinh nghiệm với 12 năm gắn bó trong lĩnh vực chăm sóc sức khỏe trẻ em. Bà đã hoàn thành chương trình đào tạo chuyên sâu về Dị ứng – Miễn dịch Nhi tại Đại học Mahidol, Thái Lan. Bác sĩ Mai luôn được phụ huynh tin tưởng nhờ sự kiên nhẫn, thấu hiểu và tận tâm khi thăm khám cho các bệnh nhi.',
    schedule: {
      'Thứ Hai': '08:00 – 12:00',
      'Thứ Ba': '13:30 – 17:00',
      'Thứ Tư': '08:00 – 12:00',
      'Thứ Năm': '13:30 – 17:00',
      'Thứ Sáu': '08:00 – 12:00',
      'Thứ Bảy': '08:00 – 11:30',
    },
  },
  {
    doctorId: 'f23d4432-04d3-4fe9-9b96-9d6fe55ee84d',
    slug: 'vo-quang-huy',
    fullName: 'Võ Quang Huy',
    title: 'BS.CKII',
    position: 'Trưởng khoa Cơ xương khớp',
    department: 'Cơ xương khớp',
    hospitalName: 'Bệnh viện Đa khoa CarePlus',
    experienceYears: 16,
    baseConsultationFee: 400000,
    avatarUrl:
      'https://ui-avatars.com/api/?name=V%C3%B5+Quang+Huy&background=0d9488&color=fff&size=200',
    education: [
      'Tốt nghiệp Bác sĩ Đa khoa – Đại học Y Dược Huế (2008)',
      'Chuyên khoa II Nội Cơ xương khớp – Đại học Y Dược TP.HCM (2014)',
      'Tu nghiệp Phẫu thuật khớp vi phẫu – Đại học Chulalongkorn, Thái Lan (2016)',
      'Chứng chỉ Siêu âm cơ xương khớp – Hội Thấp khớp học Châu Á Thái Bình Dương (APLAR)',
    ],
    specializations: [
      'Viêm khớp dạng thấp',
      'Thoái hóa khớp',
      'Loãng xương',
      'Gout',
      'Lupus ban đỏ hệ thống',
      'Tiêm nội khớp dưới hướng dẫn siêu âm',
    ],
    biography:
      'BS.CKII Võ Quang Huy là chuyên gia Cơ xương khớp với 16 năm kinh nghiệm, thành thạo các kỹ thuật chẩn đoán hình ảnh và tiêm nội khớp dưới hướng dẫn siêu âm. Ông hoàn thành chương trình tu nghiệp tại Đại học Chulalongkorn, Thái Lan và hiện là Trưởng khoa Cơ xương khớp tại CarePlus. Bác sĩ Huy luôn ưu tiên phương pháp điều trị bảo tồn, giúp bệnh nhân phục hồi chức năng vận động tối ưu.',
    schedule: {
      'Thứ Hai': '13:30 – 17:00',
      'Thứ Ba': '08:00 – 12:00',
      'Thứ Tư': '08:00 – 12:00',
      'Thứ Năm': '13:30 – 17:00',
      'Thứ Sáu': '08:00 – 12:00',
    },
  },
  {
    doctorId: '92a5bd7f-9f4e-4a14-9b28-118d9d3e839e',
    slug: 'dang-minh-tam',
    fullName: 'Đặng Minh Tâm',
    title: 'ThS.BS',
    position: 'Bác sĩ Tim mạch',
    department: 'Tim mạch',
    hospitalName: 'Bệnh viện Đa khoa CarePlus',
    experienceYears: 10,
    baseConsultationFee: 300000,
    avatarUrl:
      'https://ui-avatars.com/api/?name=%C4%90%E1%BA%B7ng+Minh+T%C3%A2m&background=0d9488&color=fff&size=200',
    education: [
      'Tốt nghiệp Bác sĩ Đa khoa – Đại học Y khoa Phạm Ngọc Thạch (2014)',
      'Thạc sĩ Y học chuyên ngành Nội Tim mạch – Đại học Y Dược TP.HCM (2019)',
      'Chứng chỉ Điện tâm đồ nâng cao – Viện Tim TP.HCM (2020)',
      'Khóa đào tạo Siêu âm Tim – Bệnh viện Tim Tâm Đức (2021)',
    ],
    specializations: [
      'Tăng huyết áp',
      'Rối loạn lipid máu',
      'Bệnh van tim',
      'Siêu âm tim',
      'Điện tâm đồ chẩn đoán',
    ],
    biography:
      'ThS.BS Đặng Minh Tâm là bác sĩ Tim mạch trẻ tài năng với 10 năm kinh nghiệm lâm sàng. Anh tốt nghiệp Thạc sĩ chuyên ngành Nội Tim mạch tại Đại học Y Dược TP.HCM và liên tục cập nhật kiến thức qua các chương trình đào tạo tại Viện Tim TP.HCM. Bác sĩ Tâm nổi bật với khả năng tư vấn rõ ràng, gần gũi và luôn đồng hành cùng bệnh nhân trong lộ trình điều trị dài hạn.',
    schedule: {
      'Thứ Hai': '08:00 – 12:00',
      'Thứ Tư': '08:00 – 12:00',
      'Thứ Năm': '08:00 – 12:00',
      'Thứ Sáu': '13:30 – 17:00',
      'Thứ Bảy': '08:00 – 11:30',
    },
  },
];

export function getDoctorById(id: string): DoctorProfile | undefined {
  return doctors.find((d) => d.doctorId === id);
}

export function getDoctorBySlug(slug: string): DoctorProfile | undefined {
  return doctors.find((d) => d.slug === slug);
}
