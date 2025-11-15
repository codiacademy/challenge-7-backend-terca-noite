import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Mail } from "lucide-react";
import api from "../../api/axios-client.ts";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

const validationSchema = Yup.object().shape({
  email: Yup.string().email("E-mail inválido").required("O email é obrigatório"),
});

export const ForgotPasswordForm = () => {
  const navigate = useNavigate();

  const handleSubmitEmail = async (values: { email: string }) => {
    try {
      const response = await api.post("http://localhost:3000/auth/verify_email", {
        email: values.email,
      });
      console.log(response);
      if (response.status === 200) {
        toast.success("Código enviado com sucesso!", {
          theme: "dark",
          onClose: () => {
            localStorage.setItem("tempToken", response.data.tempToken);
            navigate("/resetpassword");
          },
        });
      } else {
        toast.error("Erro ao enviar código para recuperação de senha!", { theme: "dark" });
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
    <div className="w-[100%]">
      <Formik
        initialValues={{
          email: "",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmitEmail}
      >
        {({ errors, touched }) => (
          <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg bg-gray-950 px-[15px] py-5">
            <h2 className="text-green-600 mb-10 text-2xl font-bold">Insira seu Email</h2>
            <h3 className="text-green-600 mb-10 text-sm">
              Digite seu email para enviarmos o código de recuperação!
            </h3>

            {/* Código */}
            <div className="flex flex-col justify-center gap-[20px] items-start w-full">
              <div className="flex justify-center items-start gap-[20px] w-full">
                {/* Wrapper do Código */}
                <div className="flex flex-col flex-1 items-start">
                  <div className="relative h-12 w-full">
                    <Field
                      type="text"
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
                      htmlFor="fullName"
                      className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                        errors.email && touched.email ? "text-red-500" : "text-gray-100"
                      } bg-gray-950 px-1`}
                    >
                      E-mail
                    </label>
                  </div>
                  <div className="h-5 mt-1">
                    {errors.email && touched.email && (
                      <div className="text-red-500 text-sm">{errors.email}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full cursor-pointer py-2 mt-3 bg-green-700 text-white rounded-md hover:bg-green-900 transition duration-200"
            >
              Enviar Código
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
