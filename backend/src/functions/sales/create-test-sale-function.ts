import { prisma } from "../../lib/prisma.ts";
import { subMonths } from "date-fns";
import { AppError } from "../../utils/app-error.ts";
import { CourseType } from "@prisma/client";

const CLIENT_NAMES = [
  "Ana Ribeiro",
  "Carlos Medeiros",
  "Fernanda Alves",
  "João Batista",
  "Mariana Duarte",
  "Rafael Moreira",
  "Sofia Martins",
  "Thiago Pires",
  "Victor Almeida",
  "Beatriz Castro",
];
const CLIENT_CPFS = [
  "12345678910",
  "98765432100",
  "11122233344",
  "55566677788",
  "99988877766",
  "01002003040",
  "22233344455",
  "32165498712",
  "74185296300",
  "15975348620",
];

const CLIENT_PHONES = [
  "32999112233",
  "11988223344",
  "21997334455",
  "31996445566",
  "41995556677",
  "51994667788",
  "61993778899",
  "71992889900",
  "81991990011",
  "91990001122",
];

const CLIENT_EMAILS = [
  "ana.ribeiro@email.com",
  "carlos.medeiros@gmail.com",
  "fernanda.alves@hotmail.com",
  "joao.batista@gmail.com",
  "mariana.duarte@email.com",
  "rafa.moreira@outlook.com",
  "sofia.martins@gmail.com",
  "thiago.pires@email.com",
  "victor.almeida@gmail.com",
  "bia.castro@outlook.com",
];

const COURSES = [
  "Curso Fullstack",
  "Curso Frontend",
  "Curso Backend",
  "Inglês para Programadores",
  "Autocad",
  "Data Science",
  "Código Limpo",
  "Áreas de TI",
  "LinkedIn para Devs",
  "Bootcamp Magic com Contratação",
  "GitHub",
  "Rotina de Resultados",
  "Intensivão HTML, CSS e JS",
  "Curso de JavaScript Avançado",
  "Fundamentos do Desenvolvimento Web",
];
const COURSETYPES = [CourseType.online, CourseType.presencial];
export async function createTestSaleFunction(userId: string, date: Date) {
  const randomClientName = randomFromArray(CLIENT_NAMES);
  const randomCpf = randomFromArray(CLIENT_CPFS);
  const randomPhone = randomFromArray(CLIENT_PHONES);
  const randomEmail = randomFromArray(CLIENT_EMAILS);
  const randomCourse = randomFromArray(COURSES);
  const randomCourseType = randomFromArray(COURSETYPES);
  const randomCourseValue = randomBetween(500, 3000);
  const randomTaxesValue = (randomBetween(0, 10) / 100) * randomCourseValue;
  const randomDiscountValue = (randomBetween(0, 40) / 100) * randomCourseValue;
  const randomCommissionValue = (randomBetween(0, 15) / 100) * randomCourseValue;
  const total_value =
    randomCourseValue - randomTaxesValue - randomDiscountValue - randomCommissionValue;
  const card_fee_value = 0.005 * randomCourseValue;
  const newSale = {
    client_name: randomClientName,
    cpf: randomCpf,
    client_phone: randomPhone,
    client_email: randomEmail,
    course: randomCourse,
    course_type: randomCourseType, // Mude para o tipo real do seu enum
    course_value: randomCourseValue,
    discount_value: randomDiscountValue,
    taxes_value: randomTaxesValue,
    commission_value: randomCommissionValue,
    card_fee_value,
    total_value,
    created_by: userId,
    created_at: date,
  };

  return newSale;
}

function randomFromArray<T>(arr: T[]): T {
  if (arr.length === 0) {
    throw new Error("Array cannot be empty");
  }
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
