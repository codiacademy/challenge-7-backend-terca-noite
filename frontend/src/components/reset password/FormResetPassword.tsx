import { Formik, Form, Field } from "formik";
import { useState } from "react";
import * as Yup from "yup";
import { Lock, Shield, Eye, EyeClosed } from "lucide-react";
import api from "../../api/axios-client.ts";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const validationSchema = Yup.object().shape({
  code: Yup.string().min(6, "O código deve ter 6 dígitos").max(6),
  password: Yup.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .required("A senha é obrigatória"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "As senhas devem ser iguais")
    .required("A confirmação de senha é obrigatória"),
});

export const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmitCodeAndPassword = async (values: {
    code: string;
    password: string;
    confirmPassword: string;
  }) => {
    try {
      const tempToken = localStorage.getItem("tempToken");
      const response = await api.post(
        "http://localhost:3000/users/reset_password",
        {
          code: values.code,
          password: values.password,
        },
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
          withCredentials: true,
        },
      );
      console.log(response);
      if (response.status === 200) {
        toast.success("Senha Alterada com Sucesso", {
          theme: "dark",
          onClose: () => {
            navigate("/signin");
          },
        });
      } else if (response.status === 200) {
        toast.error("Código inválido!", { theme: "dark" });
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message || "Erro desconhecido ao verificar código";
        toast.error(message, { theme: "dark" });
      } else {
        toast.error("Erro de conexão com o servidor", { theme: "dark" });
      }
      console.log(error);
    }
  };

  return (
    <div className="w-[100%] p-[20px]">
      <Formik
        initialValues={{
          code: "",
          password: "",
          confirmPassword: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmitCodeAndPassword}
      >
        {({ errors, touched }) => (
          <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg bg-gray-950 px-[15px] py-5">
            <h2 className="text-green-600 mb-2 text-2xl font-bold">Redefina sua Senha</h2>
            <h3 className="text-green-600 mb-5 text-sm">
              Digite o código enviado para seu email e redefina sua senha!
            </h3>
            <div className="flex flex-col justify-center items-start w-full h-[200px]">
              <div className="flex justify-center items-start gap-[20px] w-full">
                <div className="flex flex-col flex-1 items-start">
                  <div className="relative h-12 w-full">
                    <Field
                      type="text"
                      name="code"
                      placeholder=""
                      className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                        errors.code && touched.code ? "border-red-500" : "border-gray-100"
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <Shield />
                    </div>
                    <label
                      htmlFor="fullName"
                      className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                        errors.code && touched.code ? "text-red-500" : "text-gray-100"
                      } bg-gray-950 px-1`}
                    >
                      Código de Verificação
                    </label>
                  </div>
                  <div className="h-5 mt-1">
                    {errors.code && touched.code && (
                      <div className="text-red-500 text-sm">{errors.code}</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col flex-1 items-start w-full">
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
              <div className="flex flex-col flex-1 items-start w-full">
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

            <button
              type="submit"
              className="w-full cursor-pointer py-2 mt-1 bg-green-700 text-white rounded-md hover:bg-green-900 transition duration-200"
            >
              Redefinir Senha
            </button>

            <p>
              Lembrou a senha?{" "}
              <span className="text-green-500 cursor-pointer underline">
                <Link to="/signin">Tente logar novamente aqui!</Link>
              </span>
            </p>
          </Form>
        )}
      </Formik>

      <ToastContainer />
    </div>
  );
};
