export type CustomerData = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
};

export type CourseType = "presencial" | "online";

export type CourseData = {
  type: CourseType;
  name: string;
  price: number;
};

export type CreateSaleData = {
  userId: string;
  customer: CustomerData;
  course: CourseData;

  discount: number;
  taxes: number;
  commissions: number;
  cardFees: number;
  finalPrice: number;
};

export type ChangeSaleData = {
  id: string;
  userId: string;
  customer: CustomerData;
  course: CourseData;

  discount: number;
  taxes: number;
  commissions: number;
  cardFees: number;
  finalPrice: number;
};

export type Sale = {
  id: string;
  client_name: string;
  cpf: string;
  client_phone: string;
  client_email: string;
  course: string;
  course_type: string;
  course_value: number;
  discount_value: number;
  taxes_value: number;
  commission_value: number;
  card_fee_value: number;
  total_value: number;
  created_at: Date;
  updated_at: Date;
  created_by: String;
};
