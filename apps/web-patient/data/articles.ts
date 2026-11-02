export interface Article {
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  readingTime: string;
  summary: string;
  heroImage: string;
  reviewer: {
    name: string;
    role: string;
    doctorId: string;
    avatarUrl: string;
  };
  sections: { heading: string; content: string }[];
  disclaimer: string;
  references: string[];
  ctaText: string;
  ctaLink: string;
}

const DISCLAIMER =
  'Nội dung bài viết mang tính chất tham khảo và giáo dục sức khỏe, không thay thế cho việc chẩn đoán hoặc điều trị y khoa. Người bệnh cần tham vấn trực tiếp ý kiến bác sĩ chuyên khoa trước khi áp dụng bất kỳ thông tin nào. Trong trường hợp cấp cứu, vui lòng gọi ngay đường dây nóng 115 hoặc đến cơ sở y tế gần nhất.';

export const articles: Article[] = [
  /* ------------------------------------------------------------------ */
  /*  Bài 1 — Huyết áp                                                 */
  /* ------------------------------------------------------------------ */
  {
    slug: 'nhan-biet-som-va-kiem-soat-huyet-ap',
    title: 'Nhận biết sớm và kiểm soát huyết áp theo hướng dẫn Hội Tim mạch Việt Nam',
    category: 'TIM MẠCH',
    publishedAt: '25 tháng 10, 2026',
    readingTime: '8 phút đọc',
    summary:
      'Tăng huyết áp là "kẻ giết người thầm lặng" ảnh hưởng đến hơn 1,28 tỷ người trưởng thành trên toàn cầu. Bài viết tổng hợp hướng dẫn mới nhất từ Hội Tim mạch Việt Nam và WHO giúp bạn nhận biết sớm, phân loại chính xác và chủ động kiểm soát huyết áp mỗi ngày.',
    heroImage:
      'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1600&q=80',
    reviewer: {
      name: 'BS.CKII Nguyễn Minh Khôi',
      role: 'Trưởng khoa Tim mạch — Bệnh viện CarePlus',
      doctorId: '44fdd2ae-c7de-4e51-94a9-39d9cac9a452',
      avatarUrl:
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80',
    },
    sections: [
      {
        heading: 'Tăng huyết áp là gì?',
        content:
          'Tăng huyết áp (THA) là tình trạng áp lực máu lên thành động mạch cao hơn mức bình thường một cách kéo dài. Theo tiêu chuẩn của Tổ chức Y tế Thế giới (WHO) và Hội Tim mạch học Việt Nam (VNHA), một người được chẩn đoán tăng huyết áp khi huyết áp tâm thu ≥ 140 mmHg và/hoặc huyết áp tâm trương ≥ 90 mmHg đo tại phòng khám, hoặc ≥ 135/85 mmHg khi tự đo tại nhà.\n\nTheo thống kê của Bộ Y tế Việt Nam năm 2023, khoảng 25,1% người trưởng thành Việt Nam bị tăng huyết áp — tương đương gần 17 triệu người. Đáng lo ngại là gần một nửa trong số này không biết mình mắc bệnh vì THA thường diễn tiến âm thầm, không có triệu chứng rõ ràng trong giai đoạn sớm.\n\nTrên toàn cầu, WHO ước tính THA là nguyên nhân trực tiếp hoặc gián tiếp gây ra khoảng 7,5 triệu ca tử vong mỗi năm — chiếm khoảng 12,8% tổng số ca tử vong. THA làm tăng nguy cơ nhồi máu cơ tim gấp 3 lần, đột quỵ gấp 4 lần, và là yếu tố nguy cơ hàng đầu dẫn đến suy thận mạn, suy tim và bệnh mạch máu ngoại biên.\n\nViệc kiểm tra huyết áp định kỳ và nhận biết sớm các chỉ số bất thường là bước đầu tiên và quan trọng nhất trong hành trình bảo vệ sức khỏe tim mạch của mỗi người.',
      },
      {
        heading: 'Triệu chứng và dấu hiệu cảnh báo',
        content:
          'Tăng huyết áp được mệnh danh là "kẻ giết người thầm lặng" vì phần lớn bệnh nhân không có triệu chứng đặc hiệu, đặc biệt ở giai đoạn I và II. Nhiều người chỉ phát hiện bệnh khi đã xảy ra biến chứng như đột quỵ hoặc nhồi máu cơ tim.\n\nTuy nhiên, khi huyết áp tăng cao hoặc dao động mạnh, một số dấu hiệu có thể xuất hiện bao gồm: đau đầu vùng chẩm (gáy) thường vào buổi sáng sớm, hoa mắt chóng mặt khi thay đổi tư thế, ù tai, cảm giác nóng bừng mặt, tim đập nhanh hoặc hồi hộp, khó thở khi gắng sức, chảy máu cam, và mệt mỏi kéo dài không rõ nguyên nhân.\n\nĐặc biệt nguy hiểm là tình trạng cơn tăng huyết áp cấp cứu (hypertensive emergency), khi huyết áp tâm thu vượt 180 mmHg và/hoặc tâm trương vượt 120 mmHg kèm theo tổn thương cơ quan đích. Các triệu chứng cảnh báo bao gồm: đau ngực dữ dội, khó thở đột ngột, rối loạn thị giác (nhìn mờ, nhìn đôi), yếu liệt nửa người, nói khó hoặc nói ngọng, lú lẫn, buồn nôn hoặc nôn. Đây là tình huống cần gọi cấp cứu 115 ngay lập tức.\n\nChính vì tính chất âm thầm của bệnh, Bộ Y tế Việt Nam và VNHA khuyến cáo mọi người trưởng thành từ 18 tuổi nên đo huyết áp ít nhất mỗi năm một lần, và những người có yếu tố nguy cơ (tiền sử gia đình, béo phì, đái tháo đường) nên đo thường xuyên hơn — tốt nhất là tự đo tại nhà hàng ngày.',
      },
      {
        heading: 'Phân độ tăng huyết áp',
        content:
          'Theo hướng dẫn của VNHA và phân loại WHO/ISH, tăng huyết áp được chia thành các mức độ dựa trên chỉ số huyết áp đo tại phòng khám như sau:\n\n• Huyết áp tối ưu: Tâm thu < 120 mmHg VÀ tâm trương < 80 mmHg. Đây là mức huyết áp lý tưởng, giúp giảm tối đa nguy cơ tim mạch.\n\n• Huyết áp bình thường: Tâm thu 120–129 mmHg VÀ/HOẶC tâm trương 80–84 mmHg. Cần duy trì lối sống lành mạnh để ngăn ngừa tiến triển.\n\n• Huyết áp bình thường cao (tiền THA): Tâm thu 130–139 mmHg VÀ/HOẶC tâm trương 85–89 mmHg. Cần tích cực thay đổi lối sống, tái khám mỗi 3–6 tháng.\n\n• Tăng huyết áp Độ I (nhẹ): Tâm thu 140–159 mmHg VÀ/HOẶC tâm trương 90–99 mmHg. Có thể bắt đầu điều trị bằng thuốc nếu thay đổi lối sống sau 3–6 tháng không hiệu quả.\n\n• Tăng huyết áp Độ II (trung bình): Tâm thu 160–179 mmHg VÀ/HOẶC tâm trương 100–109 mmHg. Cần phối hợp dùng thuốc và thay đổi lối sống.\n\n• Tăng huyết áp Độ III (nặng): Tâm thu ≥ 180 mmHg VÀ/HOẶC tâm trương ≥ 110 mmHg. Cần điều trị tích cực, theo dõi sát và có thể nhập viện.\n\nĐiều quan trọng là kết quả đo một lần chưa đủ để chẩn đoán. VNHA khuyến cáo cần đo ít nhất 2 lần ở 2 lần khám khác nhau trước khi kết luận, trừ trường hợp huyết áp rất cao (≥ 180/110 mmHg) hoặc có tổn thương cơ quan đích rõ ràng.',
      },
      {
        heading: 'Nguyên nhân và yếu tố nguy cơ',
        content:
          'Khoảng 90–95% trường hợp THA thuộc loại vô căn (nguyên phát), nghĩa là không xác định được nguyên nhân cụ thể mà là kết quả tương tác phức tạp giữa yếu tố di truyền, môi trường và lối sống. Chỉ 5–10% còn lại là THA thứ phát do các nguyên nhân có thể xác định được như bệnh thận, hẹp động mạch thận, u tuyến thượng thận, hoặc do thuốc.\n\nCác yếu tố nguy cơ không thể thay đổi bao gồm: tuổi tác (nam giới từ 45 tuổi, nữ giới từ 55 tuổi nguy cơ tăng rõ rệt), di truyền (người có cha mẹ hoặc anh chị em ruột bị THA có nguy cơ cao gấp 2–3 lần), giới tính (nam giới mắc sớm hơn nhưng nữ giới sau mãn kinh có nguy cơ tương đương), và chủng tộc.\n\nCác yếu tố nguy cơ có thể thay đổi — và đây chính là mục tiêu phòng ngừa — bao gồm: chế độ ăn nhiều muối (trung bình người Việt tiêu thụ 9–10 g muối/ngày, gấp đôi khuyến cáo của WHO là < 5 g/ngày), thừa cân béo phì (BMI ≥ 23 theo tiêu chuẩn châu Á), ít vận động thể lực, hút thuốc lá (cả chủ động và thụ động), sử dụng rượu bia quá mức, stress kéo dài, rối loạn lipid máu, đái tháo đường, và hội chứng ngưng thở khi ngủ.\n\nNghiên cứu PURE (Prospective Urban Rural Epidemiology) trên hơn 150.000 người ở 17 quốc gia, bao gồm Việt Nam, cho thấy việc kiểm soát đồng thời nhiều yếu tố nguy cơ có thể giảm đến 80% biến cố tim mạch nghiêm trọng.',
      },
      {
        heading: 'Khuyến cáo phòng ngừa từ Bộ Y tế và WHO',
        content:
          'Bộ Y tế Việt Nam và WHO thống nhất đưa ra các khuyến cáo phòng ngừa THA dựa trên bằng chứng khoa học vững chắc, tập trung vào thay đổi lối sống — đây là biện pháp nền tảng cho cả phòng ngừa và điều trị:\n\n1. Giảm muối: Hạn chế lượng muối dưới 5 g/ngày (tương đương khoảng 1 thìa cà phê). Giảm sử dụng nước mắm, mì chính, thực phẩm chế biến sẵn. Nghiên cứu cho thấy giảm 3 g muối/ngày có thể hạ huyết áp tâm thu 3–5 mmHg.\n\n2. Chế độ ăn DASH (Dietary Approaches to Stop Hypertension): Tăng cường rau xanh (400–500 g/ngày), trái cây, ngũ cốc nguyên hạt, cá, gia cầm, các loại đậu và hạt. Hạn chế thịt đỏ, đồ ngọt, thức ăn nhanh và đồ uống có đường. Chế độ ăn DASH đã được chứng minh giảm huyết áp tâm thu 8–14 mmHg.\n\n3. Vận động thể lực: WHO khuyến cáo ít nhất 150 phút hoạt động thể chất cường độ vừa phải (đi bộ nhanh, bơi, đạp xe) hoặc 75 phút cường độ mạnh mỗi tuần. Tập luyện đều đặn có thể giảm huyết áp tâm thu 5–8 mmHg.\n\n4. Kiểm soát cân nặng: Duy trì BMI trong khoảng 18,5–22,9. Mỗi kg giảm cân có thể hạ huyết áp khoảng 1 mmHg.\n\n5. Hạn chế rượu bia: Nam giới không quá 2 đơn vị cồn/ngày, nữ giới không quá 1 đơn vị cồn/ngày (1 đơn vị = 330 ml bia hoặc 120 ml rượu vang).\n\n6. Ngừng hút thuốc lá: Hút thuốc làm tăng huyết áp tạm thời nhưng gây tổn thương mạch máu vĩnh viễn. Ngừng hút thuốc giảm 30–50% nguy cơ biến cố tim mạch trong vòng 2 năm.\n\n7. Quản lý stress: Thực hành thiền, yoga, hít thở sâu, ngủ đủ 7–8 tiếng/đêm. Stress mạn tính kích hoạt hệ thần kinh giao cảm và trục renin-angiotensin, làm tăng huyết áp kéo dài.',
      },
      {
        heading: 'Khi nào cần đến gặp bác sĩ?',
        content:
          'Bạn nên đến gặp bác sĩ chuyên khoa Tim mạch ngay khi phát hiện một trong các tình huống sau:\n\n• Huyết áp đo tại nhà liên tục ≥ 140/90 mmHg trong ít nhất 2 ngày khác nhau.\n\n• Huyết áp bình thường cao (130–139/85–89 mmHg) kèm theo có yếu tố nguy cơ: đái tháo đường, bệnh thận, tiền sử gia đình có người THA hoặc đột quỵ trước 60 tuổi.\n\n• Xuất hiện các triệu chứng nghi ngờ: đau đầu dai dẳng, chóng mặt, đánh trống ngực, khó thở khi gắng sức, phù chân, thị lực giảm.\n\n• Đang điều trị THA nhưng huyết áp không đạt mục tiêu (< 140/90 mmHg hoặc < 130/80 mmHg nếu có đái tháo đường) sau 4–8 tuần dùng thuốc đều đặn.\n\nĐặc biệt, hãy GỌI CẤP CỨU 115 NGAY nếu: huyết áp ≥ 180/120 mmHg kèm đau ngực, khó thở, yếu liệt chi, nói khó, rối loạn ý thức, hoặc co giật. Đây là tình huống cần xử trí trong vòng "giờ vàng" để tránh tổn thương não, tim và thận không hồi phục.\n\nViệc khám sức khỏe tim mạch định kỳ 6–12 tháng/lần giúp phát hiện sớm THA và các bệnh lý đồng mắc, từ đó xây dựng phác đồ điều trị cá thể hóa phù hợp nhất cho từng bệnh nhân.',
      },
    ],
    disclaimer: DISCLAIMER,
    references: [
      'Hội Tim mạch học Việt Nam (VNHA). Khuyến cáo Chẩn đoán và Điều trị Tăng huyết áp ở người lớn, cập nhật 2022.',
      'Bộ Y tế Việt Nam. Hướng dẫn Chẩn đoán và Điều trị Tăng huyết áp (Ban hành kèm Quyết định số 3192/QĐ-BYT).',
      'World Health Organization. WHO Guideline for the pharmacological treatment of hypertension in adults, 2023.',
      'Williams B, Mancia G, et al. 2018 ESC/ESH Guidelines for the management of arterial hypertension. European Heart Journal. 2018;39(33):3021-3104.',
      'Yusuf S, et al. Modifiable risk factors, cardiovascular disease, and mortality in 155 722 individuals from 21 high-income, middle-income, and low-income countries (PURE). Lancet. 2020;395(10226):795-808.',
    ],
    ctaText: 'Đặt lịch tư vấn với chuyên gia Tim mạch',
    ctaLink: '/booking?specialty=Tim+m%E1%BA%A1ch#doctors',
  },

  /* ------------------------------------------------------------------ */
  /*  Bài 2 — Đột quỵ                                                  */
  /* ------------------------------------------------------------------ */
  {
    slug: 'phong-ngua-dot-quy-benh-nen-tim-mach',
    title: 'Phòng ngừa đột quỵ ở người có bệnh nền tim mạch',
    category: 'TIM MẠCH',
    publishedAt: '18 tháng 10, 2026',
    readingTime: '10 phút đọc',
    summary:
      'Bệnh nhân có bệnh nền tim mạch đối mặt với nguy cơ đột quỵ cao gấp 2–5 lần so với người bình thường. Bài viết phân tích mối liên hệ giữa bệnh tim và đột quỵ, cách nhận biết sớm theo quy tắc F.A.S.T, và chiến lược phòng ngừa hiệu quả dựa trên khuyến cáo quốc tế.',
    heroImage:
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1600&q=80',
    reviewer: {
      name: 'BS.CKII Nguyễn Minh Khôi',
      role: 'Trưởng khoa Tim mạch — Bệnh viện CarePlus',
      doctorId: '44fdd2ae-c7de-4e51-94a9-39d9cac9a452',
      avatarUrl:
        'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=200&q=80',
    },
    sections: [
      {
        heading: 'Đột quỵ và mối liên hệ với bệnh tim mạch',
        content:
          'Đột quỵ (stroke) hay còn gọi là tai biến mạch máu não, xảy ra khi dòng máu nuôi não bị gián đoạn đột ngột — do tắc nghẽn (đột quỵ thiếu máu cục bộ, chiếm khoảng 85% trường hợp) hoặc do vỡ mạch máu (đột quỵ xuất huyết, chiếm 15%). Theo WHO, đột quỵ là nguyên nhân gây tử vong đứng hàng thứ hai trên toàn cầu và là nguyên nhân hàng đầu gây tàn phế ở người trưởng thành.\n\nTại Việt Nam, ước tính mỗi năm có khoảng 200.000 ca đột quỵ mới, trong đó khoảng 50% tử vong hoặc tàn phế nặng. Đáng chú ý là xu hướng đột quỵ ở người trẻ (< 45 tuổi) đang gia tăng, chiếm khoảng 7–15% tổng số ca.\n\nMối liên hệ giữa bệnh tim mạch và đột quỵ rất chặt chẽ. Rung nhĩ (atrial fibrillation) — rối loạn nhịp tim phổ biến nhất — làm tăng nguy cơ đột quỵ gấp 5 lần do cơ chế hình thành huyết khối trong buồng tim. Tăng huyết áp, bệnh mạch vành, suy tim, bệnh van tim và xơ vữa động mạch đều là các yếu tố nguy cơ trực tiếp gây đột quỵ.\n\nNghiên cứu Framingham Heart Study — nghiên cứu dịch tễ học tim mạch lớn nhất thế giới kéo dài hơn 70 năm — đã chứng minh rằng bệnh nhân suy tim có nguy cơ đột quỵ cao gấp 2–3 lần, và bệnh nhân rung nhĩ không được điều trị kháng đông có tỷ lệ đột quỵ lên đến 5% mỗi năm.',
      },
      {
        heading: 'Các yếu tố nguy cơ chính',
        content:
          'Các yếu tố nguy cơ đột quỵ ở bệnh nhân tim mạch được phân thành hai nhóm:\n\nNhóm yếu tố nguy cơ tim mạch trực tiếp:\n\n• Rung nhĩ (AF): Là yếu tố nguy cơ mạnh nhất, đặc biệt nguy hiểm ở người cao tuổi. Thang điểm CHA₂DS₂-VASc được sử dụng để đánh giá nguy cơ đột quỵ ở bệnh nhân rung nhĩ và quyết định chỉ định kháng đông. Bệnh nhân có điểm CHA₂DS₂-VASc ≥ 2 (nam) hoặc ≥ 3 (nữ) cần dùng thuốc kháng đông đường uống.\n\n• Tăng huyết áp: Là yếu tố nguy cơ phổ biến nhất và có thể kiểm soát được. Mỗi 10 mmHg giảm huyết áp tâm thu liên quan đến giảm 27% nguy cơ đột quỵ (theo phân tích gộp của Lancet, 2016).\n\n• Bệnh mạch vành và nhồi máu cơ tim: Xơ vữa động mạch vành thường đi kèm xơ vữa động mạch cảnh — nguồn gốc của nhiều cơn đột quỵ thiếu máu. Sau nhồi máu cơ tim cấp, nguy cơ đột quỵ tăng cao trong 30 ngày đầu.\n\n• Suy tim: Giảm phân suất tống máu (EF < 35%) và giãn buồng tim tạo điều kiện hình thành huyết khối, đặc biệt ở vùng vô động thành tim.\n\nNhóm yếu tố nguy cơ chuyển hóa và lối sống:\n\n• Đái tháo đường type 2: Tăng nguy cơ đột quỵ gấp 2–4 lần, đồng thời làm nặng thêm tổn thương mạch máu nhỏ và lớn.\n\n• Rối loạn lipid máu: LDL-cholesterol cao thúc đẩy mảng xơ vữa, tăng nguy cơ huyết khối. Statin đã được chứng minh giảm 25–30% nguy cơ đột quỵ thiếu máu.\n\n• Hút thuốc lá, béo phì, ít vận động, uống rượu bia nhiều: Các yếu tố này vừa làm nặng bệnh tim mạch nền, vừa trực tiếp tăng nguy cơ đột quỵ.\n\nViệc nhận biết đầy đủ các yếu tố nguy cơ giúp bác sĩ và bệnh nhân cùng xây dựng chiến lược phòng ngừa toàn diện và cá thể hóa.',
      },
      {
        heading: 'Triệu chứng nhận biết đột quỵ — Quy tắc F.A.S.T',
        content:
          'Nhận biết sớm triệu chứng đột quỵ là yếu tố quyết định sống còn. Mỗi phút trôi qua khi não thiếu máu, khoảng 1,9 triệu tế bào thần kinh bị tổn thương. Thời gian "giờ vàng" để can thiệp hiệu quả nhất là trong 4,5 giờ đầu (đối với tiêu sợi huyết) và 6–24 giờ (đối với lấy huyết khối cơ học) kể từ khi khởi phát triệu chứng.\n\nQuy tắc F.A.S.T — được Hội Đột quỵ Hoa Kỳ (ASA) và WHO khuyến cáo sử dụng rộng rãi — giúp người dân nhận biết nhanh các dấu hiệu đột quỵ:\n\n• F — Face (Mặt): Yêu cầu người bệnh mỉm cười. Quan sát xem một bên mặt có bị xệ, méo, hoặc tê liệt không? Nếp nhăn mũi má một bên bị mờ đi là dấu hiệu quan trọng.\n\n• A — Arms (Tay): Yêu cầu giơ cả hai tay lên ngang vai và giữ trong 10 giây. Nếu một tay bị rơi xuống, yếu hoặc không thể giơ lên — đây là dấu hiệu liệt vận động.\n\n• S — Speech (Nói): Yêu cầu nói lại một câu đơn giản (ví dụ: "Hôm nay trời đẹp"). Lắng nghe xem giọng nói có bị méo, nói lắp, nói khó hiểu, hoặc không nói được không?\n\n• T — Time (Thời gian): Nếu phát hiện BẤT KỲ một trong ba dấu hiệu trên — hãy GỌI CẤP CỨU 115 NGAY LẬP TỨC. Ghi nhận thời điểm bắt đầu triệu chứng vì đây là thông tin quan trọng cho bác sĩ quyết định phương pháp điều trị.\n\nNgoài F.A.S.T, các triệu chứng bổ sung cần lưu ý bao gồm: đau đầu dữ dội đột ngột ("cơn đau đầu tồi tệ nhất cuộc đời"), rối loạn thị giác (mất thị lực một bên, nhìn đôi), chóng mặt kèm mất thăng bằng, buồn nôn hoặc nôn, và lú lẫn ý thức.\n\nĐiều cực kỳ quan trọng: KHÔNG tự ý cho bệnh nhân uống thuốc hạ huyết áp, aspirin hay bất kỳ thuốc nào khi nghi ngờ đột quỵ. Hãy để bệnh nhân nằm nghiêng an toàn, nới lỏng quần áo, và chờ xe cấp cứu.',
      },
      {
        heading: 'Chiến lược phòng ngừa theo khuyến cáo quốc tế',
        content:
          'Hiệp hội Tim mạch Hoa Kỳ (AHA) và Hiệp hội Đột quỵ Hoa Kỳ (ASA) phân biệt rõ phòng ngừa tiên phát (chưa từng bị đột quỵ) và phòng ngừa thứ phát (đã từng bị đột quỵ hoặc cơn thiếu máu não thoáng qua — TIA). Các chiến lược chung bao gồm:\n\n1. Kiểm soát huyết áp nghiêm ngặt: Mục tiêu < 130/80 mmHg ở bệnh nhân nguy cơ cao. Ưu tiên sử dụng nhóm thuốc ức chế men chuyển (ACEi), chẹn thụ thể angiotensin II (ARB), hoặc chẹn kênh canxi theo phác đồ cá thể hóa. Tuân thủ dùng thuốc đều đặn là yếu tố then chốt — nghiên cứu cho thấy bệnh nhân ngừng thuốc hạ áp có nguy cơ đột quỵ tăng gấp 3,8 lần.\n\n2. Điều trị kháng đông ở bệnh nhân rung nhĩ: Thuốc kháng đông đường uống thế hệ mới (NOAC: dabigatran, rivaroxaban, apixaban, edoxaban) được ưu tiên hơn warfarin nhờ hiệu quả tương đương, ít tương tác thuốc-thực phẩm, và không cần theo dõi INR thường xuyên. Thuốc giúp giảm 60–70% nguy cơ đột quỵ do rung nhĩ.\n\n3. Điều trị rối loạn lipid máu: Statin cường độ cao (atorvastatin 40–80 mg hoặc rosuvastatin 20–40 mg) được khuyến cáo cho bệnh nhân đã có biến cố tim mạch hoặc xơ vữa, với mục tiêu LDL-C < 1,4 mmol/L (55 mg/dL).\n\n4. Kháng kết tập tiểu cầu: Aspirin liều thấp (75–100 mg/ngày) hoặc clopidogrel được chỉ định cho phòng ngừa đột quỵ ở bệnh nhân xơ vữa mạch máu không có rung nhĩ. Phối hợp kháng tiểu cầu kép (aspirin + clopidogrel) trong 21 ngày đầu sau TIA hoặc đột quỵ nhẹ giúp giảm thêm 25% nguy cơ tái phát.\n\n5. Thay đổi lối sống toàn diện: Chế độ ăn Địa Trung Hải hoặc DASH, tập thể dục ≥ 150 phút/tuần, ngừng hút thuốc, hạn chế rượu bia, kiểm soát cân nặng (BMI 18,5–22,9), và quản lý stress. Nghiên cứu INTERSTROKE trên 26.919 người tại 32 quốc gia chứng minh 10 yếu tố nguy cơ có thể thay đổi chiếm đến 90,7% nguy cơ quy thuộc quần thể của đột quỵ.',
      },
      {
        heading: 'Vai trò của kiểm tra sức khỏe định kỳ',
        content:
          'Kiểm tra sức khỏe định kỳ đóng vai trò then chốt trong chiến lược phòng ngừa đột quỵ, đặc biệt ở những người đã có bệnh nền tim mạch. Mục tiêu là phát hiện sớm các yếu tố nguy cơ mới, đánh giá hiệu quả điều trị hiện tại, và điều chỉnh phác đồ kịp thời.\n\nGói kiểm tra tim mạch định kỳ được khuyến cáo bao gồm:\n\n• Đo huyết áp và theo dõi huyết áp lưu động 24 giờ (ABPM): Phát hiện THA áo choàng trắng, THA ẩn giấu, và đánh giá kiểm soát huyết áp ban đêm.\n\n• Điện tâm đồ (ECG/EKG): Tầm soát rung nhĩ, phì đại thất trái, thiếu máu cơ tim, và rối loạn dẫn truyền. Người trên 65 tuổi nên được sàng lọc rung nhĩ bằng ECG ít nhất mỗi năm một lần.\n\n• Siêu âm tim (Echocardiography): Đánh giá chức năng co bóp tim (EF), phát hiện bệnh van tim, huyết khối buồng tim, và các bất thường cấu trúc. Đặc biệt quan trọng ở bệnh nhân suy tim và sau nhồi máu cơ tim.\n\n• Siêu âm Doppler mạch cảnh: Phát hiện mảng xơ vữa, hẹp động mạch cảnh — nguồn gốc trực tiếp của nhiều cơn đột quỵ thiếu máu. Hẹp mạch cảnh ≥ 70% cần xem xét can thiệp (phẫu thuật hoặc đặt stent).\n\n• Xét nghiệm máu: Đường huyết lúc đói, HbA1c, lipid máu toàn phần (cholesterol, LDL, HDL, triglyceride), chức năng thận (creatinine, eGFR), công thức máu, và INR (nếu dùng warfarin).\n\n• Holter ECG 24–48 giờ: Đặc biệt quan trọng ở bệnh nhân có triệu chứng hồi hộp, đánh trống ngực, hoặc đã từng bị đột quỵ không rõ nguyên nhân (cryptogenic stroke) — giúp phát hiện rung nhĩ kịch phát.\n\nTần suất kiểm tra khuyến cáo: mỗi 6 tháng đối với bệnh nhân nguy cơ cao (đã có biến cố tim mạch, rung nhĩ, THA khó kiểm soát), và mỗi 12 tháng đối với nhóm nguy cơ trung bình. Điều quan trọng là duy trì tái khám đúng hẹn và mang theo sổ theo dõi huyết áp, thuốc đang dùng để bác sĩ có đủ thông tin đưa ra quyết định điều trị tốt nhất.',
      },
    ],
    disclaimer: DISCLAIMER,
    references: [
      'American Heart Association / American Stroke Association (AHA/ASA). Guidelines for the Prevention of Stroke in Patients with Stroke and Transient Ischemic Attack, 2021 Update.',
      'World Health Organization. Global Report on Stroke, 2022.',
      'Bộ Y tế Việt Nam. Hướng dẫn Chẩn đoán và Xử trí Đột quỵ não (Ban hành kèm Quyết định số 5331/QĐ-BYT).',
      'O\'Donnell MJ, et al. Global and regional effects of potentially modifiable risk factors associated with acute stroke in 32 countries (INTERSTROKE): a case-control study. Lancet. 2016;388(10046):761-775.',
      'Hindricks G, et al. 2020 ESC Guidelines for the diagnosis and management of atrial fibrillation. European Heart Journal. 2021;42(5):373-498.',
      'Ettehad D, et al. Blood pressure lowering for prevention of cardiovascular disease and death: a systematic review and meta-analysis. Lancet. 2016;387(10022):957-967.',
    ],
    ctaText: 'Đặt lịch tư vấn với chuyên gia Tim mạch',
    ctaLink: '/booking?specialty=Tim+m%E1%BA%A1ch#doctors',
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
