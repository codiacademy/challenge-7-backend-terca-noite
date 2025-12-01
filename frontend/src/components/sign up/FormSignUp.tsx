import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeClosed, User, Lock, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const validationSchema = Yup.object().shape({
  fullName: Yup.string()
    .min(2, "O nome completo deve ter pelo menos 2 caracteres")
    .required("O nome completo é obrigatório"),
  email: Yup.string().email("E‑mail inválido").required("O e‑mail é obrigatório"),
  telephone: Yup.string().test(
    "digits-only-length",
    "O telefone deve conter 10 ou 11 dígitos",
    (value) => {
      const digits = (value || "").replace(/\D/g, "");
      return digits.length === 10 || digits.length === 11;
    },
  ),
  password: Yup.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .required("A senha é obrigatória"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "As senhas devem ser iguais")
    .required("A confirmação de senha é obrigatória"),
});

export const SignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // formata número enquanto o usuário digita: (xx) xxxx xxxx  ou (xx) xxxxx xxxx
  const formatPhone = (value: string) => {
    const digits = (value || "").replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10)
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`;
    // 11 dígitos
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)} ${digits.slice(7)}`;
  };

  // remove parênteses/espacos/traços deixando só dígitos
  const unformatPhone = (value: string) => (value || "").replace(/\D/g, "");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmitSignup = async (values: {
    fullName: string;
    email: string;
    telephone: string;
    password: string;
  }) => {
    try {
      // envia telefone sem formatação (apenas dígitos)
      const payload = { ...values, telephone: unformatPhone(values.telephone) };

      const response = await fetch("http://localhost:3000/users/create_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(response);
      if (response.ok) {
        toast.success("Conta criada com sucesso!", { theme: "dark" });
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      } else {
        toast.error("Erro ao criar conta!", { theme: "dark" });
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-[100%] p-[20px]">
      <Formik
        initialValues={{
          fullName: "",
          email: "",
          telephone: "",
          password: "",
          confirmPassword: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmitSignup}
      >
        {({ errors, touched }) => (
          <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg bg-gray-950 px-[15px] py-5">
            <h2 className="text-green-600 mb-5 text-2xl font-bold">Criar Conta</h2>

            <div className="flex flex-col justify-center items-start w-full">
              <div className="flex justify-center items-start gap-[5px] md:gap-[20px] w-full flex-col md:flex-row">
                <div className="w-full flex flex-col flex-1 items-start">
                  <div className="relative h-12 w-full">
                    <Field
                      type="text"
                      name="fullName"
                      placeholder=""
                      className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                        errors.fullName && touched.fullName ? "border-red-500" : "border-gray-100"
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <User />
                    </div>
                    <label
                      htmlFor="fullName"
                      className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                        errors.fullName && touched.fullName ? "text-red-500" : "text-gray-100"
                      } bg-gray-950 px-1`}
                    >
                      Nome completo
                    </label>
                  </div>
                  <div className="h-5 mt-1">
                    {errors.fullName && touched.fullName && (
                      <div className="text-red-500 text-sm">{errors.fullName}</div>
                    )}
                  </div>
                </div>

                {/* Wrapper do E-mail */}
                <div className="w-full flex flex-col flex-1 items-start">
                  <div className="relative h-12 w-full">
                    <Field
                      type="email"
                      name="email"
                      placeholder=""
                      className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                        errors.email && touched.email ? "border-red-500" : "border-gray-100"
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Mail />
                    </div>
                    <label
                      htmlFor="email"
                      className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                        errors.email && touched.email ? "text-red-500" : "text-gray-100"
                      } bg-gray-950 px-1`}
                    >
                      E‑mail
                    </label>
                  </div>
                  <div className="h-5 mt-1">
                    {errors.email && touched.email && (
                      <div className="text-red-500 text-sm">{errors.email}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className=" w-full flex justify-center items-start gap-[20px] ">
                {/* Wrapper do Telefone */}
                <div className="flex flex-col flex-1 items-start w-full">
                  <Field name="telephone">
                    {({ field, form }: any) => (
                      <div className="relative h-12 w-full">
                        <input
                          {...field}
                          type="text"
                          inputMode="numeric"
                          value={field.value || ""}
                          onChange={(e) => {
                            const formatted = formatPhone(e.target.value);
                            form.setFieldValue("telephone", formatted);
                          }}
                          placeholder=""
                          className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                            errors.telephone && touched.telephone
                              ? "border-red-500"
                              : "border-gray-100"
                          }`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <Phone />
                        </div>
                        <label
                          htmlFor="telephone"
                          className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                            errors.telephone && touched.telephone ? "text-red-500" : "text-gray-100"
                          } bg-gray-950 px-1`}
                        >
                          Telefone
                        </label>
                      </div>
                    )}
                  </Field>
                  <div className="h-5 mt-1">
                    {errors.telephone && touched.telephone && (
                      <div className="text-red-500 text-sm">{errors.telephone}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-center items-start gap-[5px] md:gap-[20px] w-full flex-col md:flex-row">
                {/* Wrapper da Senha */}
                <div className=" w-full flex flex-col flex-1 items-start">
                  <div className="relative h-12 w-full">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder=" "
                      className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                        errors.password && touched.password ? "border-red-500" : "border-gray-100"
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Lock />
                    </div>
                    <label
                      htmlFor="password"
                      className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                        errors.password && touched.password ? "text-red-500" : "text-gray-100"
                      } bg-gray-950 px-1`}
                    >
                      Senha
                    </label>
                    <div
                      className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <Eye /> : <EyeClosed />}
                    </div>
                  </div>
                  <div className="h-5 mt-1">
                    {errors.password && touched.password && (
                      <div className="text-red-500 text-sm">{errors.password}</div>
                    )}
                  </div>
                </div>

                {/* Wrapper Confirmar Senha */}
                <div className=" w-full flex flex-col flex-1 items-start">
                  <div className="relative h-12 w-full">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder=" "
                      className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "border-red-500"
                          : "border-gray-100"
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Lock />
                    </div>
                    <label
                      htmlFor="confirmPassword"
                      className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                        errors.confirmPassword && touched.confirmPassword
                          ? "text-red-500"
                          : "text-gray-100"
                      } bg-gray-950 px-1`}
                    >
                      Confirmar Senha
                    </label>
                  </div>
                  <div className="h-5 mt-1">
                    {errors.confirmPassword && touched.confirmPassword && (
                      <div className="text-red-500 text-sm">{errors.confirmPassword}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer py-2  bg-green-700 text-white rounded-md hover:bg-green-900 transition duration-200"
            >
              Criar Conta
            </button>

            <p className="mt-1">
              Já possui conta?{" "}
              <span
                className="text-green-500 cursor-pointer underline"
                onClick={() => navigate("/signin")}
              >
                Faça login aqui
              </span>
            </p>
          </Form>
        )}
      </Formik>

      <ToastContainer />
    </div>
  );
};
