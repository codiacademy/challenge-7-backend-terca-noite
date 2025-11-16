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

export type SaleData = {
  userId: string;
  customer: CustomerData;
  course: CourseData;

  discount: number;
  taxes: number;
  commissions: number;
  cardFees: number;
  finalPrice: number;
};
