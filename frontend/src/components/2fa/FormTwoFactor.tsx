import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Shield } from "lucide-react";
import api from "../../api/axios-client.ts";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
const validationSchema = Yup.object().shape({
  code: Yup.string().min(6, "O código deve ter 6 dígitos").max(6),
});

export const TwoFactorForm = () => {
  const navigate = useNavigate();

  const tempToken = localStorage.getItem("tempToken");

  const handleSubmitSignup = async (values: { code: string }) => {
    try {
      const response = await api.post(
        "http://localhost:3000/2fa/verify",
        {
          code: values.code,
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
        toast.success("Login efetuado com sucesso!", { theme: "dark" });
        const accessToken = response.data.accessToken;
        localStorage.setItem("accessToken", accessToken);
        localStorage.removeItem("tempToken");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error("Erro ao logar com verificação em dois fatores!", { theme: "dark" });
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

  async function resendCode() {
    try {
      const response = await api.post(
        "http://localhost:3000/2fa/resend_two_factor",
        {},
        {
          headers: {
            Authorization: `Bearer ${tempToken}`,
          },
        },
      );
      if (response.status === 200) {
        localStorage.setItem("tempToken", response.data.tempToken);
        toast.success("Novo código enviado para seu e-mail!", { theme: "dark" });
      } else {
        toast.error("Erro ao reenviar código!", { theme: "dark" });
      }
    } catch (error: any) {
      if (error.response?.data?.code === "TEMP_TOKEN_EXPIRED") {
        toast.error("Seu código expirou. Faça login novamente.");
        localStorage.removeItem("tempToken");
        await setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
      if (axios.isAxiosError(error) && error.response) {
        const message = error.response.data?.message || "Erro desconhecido ao reenviar código";
        toast.error(message, { theme: "dark" });
      } else {
        toast.error("Erro de conexão com o servidor", { theme: "dark" });
      }
      console.log(error);
    }
  }

  return (
    <div className="w-[100%]">
      <Formik
        initialValues={{
          code: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmitSignup}
      >
        {({ errors, touched }) => (
          <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg bg-gray-950 px-[15px] py-5">
            <h2 className="text-green-600 mb-10 text-2xl font-bold">
              Insira o Código de Verificação
            </h2>
            <h3 className="text-green-600 mb-10 text-sm">
              Enviamos seu código por email, cheque sua caixa de spam!
            </h3>

            {/* Código */}
            <div className="flex flex-col justify-center gap-[20px] items-start w-full">
              <div className="flex justify-center items-start gap-[20px] w-full">
                {/* Wrapper do Código */}
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
            </div>
            <button
              type="submit"
              className="w-full cursor-pointer py-2 mt-3 bg-green-700 text-white rounded-md hover:bg-green-900 transition duration-200"
            >
              Submeter Código
            </button>

            <p>
              Código Expirado?{" "}
              <span
                className="text-green-500 cursor-pointer underline"
                onClick={async () => await resendCode()}
              >
                Gere um novo código clicando aqui!
              </span>
            </p>
          </Form>
        )}
      </Formik>

      <ToastContainer />
    </div>
  );
};
