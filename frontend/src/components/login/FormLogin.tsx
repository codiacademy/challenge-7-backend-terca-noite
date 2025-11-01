import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeClosed, User, Lock } from "lucide-react";
import { userData } from "@/data/UserData";
import { useState } from "react";
import { CheckboxLoginRegister } from "../common/CheckboxLoginRegister";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const validationSchema = Yup.object().shape({
  email: Yup.string()
    .email("E-mail inválido")
    .required("O email é obrigatório"),
  password: Yup.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .required("A senha é obrigatória"),
});

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmitLogin = async (values: {
    email: string;
    password: string;
  }) => {
    if (
      userData.email === values.email &&
      userData.password === values.password
    ) {
      toast.success("Login concluído com sucesso!", { theme: "dark" });
      navigate("/");
    } else {
      toast.error("E-mail ou senha inválidos", { theme: "dark" });
    }
  };

  return (
    <div>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={validationSchema}
        onSubmit={handleSubmitLogin}
      >
        {({ errors, touched }) => (
          <Form className="min-w-full max-w-md space-y-4 rounded-lg bg-gray-950 px-15 py-5">
            <div>
              <h2 className="text-green-600 mb-10 text-2xl font-bold">Login</h2>

              <div className="relative">
                <div className="relative">
                  <Field
                    type="email"
                    name="email"
                    placeholder=""
                    className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                      errors.email && touched.email
                        ? "border-red-500"
                        : "border-gray-100"
                    }`}
                  />

                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center cursor-pointer">
                    <User />
                  </div>

                  <label
                    htmlFor="password"
                    className={`absolute left-4 -top-2 text-sm font-medium transition-all duration-200 ease-in-out
                      ${
                        errors.password && touched.password
                          ? "text-red-500"
                          : "text-gray-100"
                      }
                         bg-gray-950 px-1
                    `}
                  >
                    E-mail
                  </label>
                </div>
                {errors.email && touched.email && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="relative mt-6">
                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder=" "
                    className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                      errors.password && touched.password
                        ? "border-red-500"
                        : "border-gray-100"
                    }`}
                  />

                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center cursor-pointer">
                    <Lock />
                  </div>

                  <label
                    htmlFor="password"
                    className={`absolute left-4 -top-2 text-sm font-medium transition-all duration-200 ease-in-out
                    ${
                      errors.password && touched.password
                        ? "text-red-500"
                        : "text-gray-100"
                    }
                     bg-gray-950 px-1
                    `}
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
                {errors.password && touched.password && (
                  <div className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <CheckboxLoginRegister titleChecked="Memorizar senha" />

              <p className="text-sm cursor-pointer hover:text-gray-400">
                Esqueceu a senha?
              </p>
            </div>

            <button
              type="submit"
              className="w-full cursor-pointer py-2 mt-3 bg-green-700 text-white rounded-md hover:bg-green-900 transition duration-200"
            >
              Entrar
            </button>

            <p>
              Ainda não possui uma conta?{" "}
              <span className="text-green-500 cursor-pointer underline">
                Clique aqui
              </span>
            </p>
          </Form>
        )}
      </Formik>

      <ToastContainer />
    </div>
  );
};
