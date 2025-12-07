import { SettingSection } from "./SettingSection";
import { ToggleSwitch } from "./ToggleSwitch";
import { useState } from "react";
import axios from "axios";
import { ProfileConfigsType } from "../../types/types";
import * as Yup from "yup";
import { toast } from "react-toastify";
import api from "../../api/axios-client.ts";
import { Formik, Form, Field } from "formik";
import { Eye, EyeClosed, Lock } from "lucide-react";
const newPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .required("A senha é obrigatória"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "As senhas devem ser iguais")
    .required("A confirmação de senha é obrigatória"),
});

const previousPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .min(6, "A senha deve ter pelo menos 6 caracteres")
    .required("A senha é obrigatória"),
});

export const Security = ({ user, isLoading }: { user: ProfileConfigsType; isLoading: boolean }) => {
  if (isLoading || !user) {
    return <div>Carregando...</div>;
  }
  const [twoFactor, setTwoFactor] = useState(user.two_factor_enabled);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState<Boolean>(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleSubmitPreviousPassword = async (values: { password: string }) => {
    try {
      const token = localStorage.getItem("accessToken") || null;
      if (!token) {
        console.log("Access token não encontrado no localStorage");
      }
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const payload = values;
      console.log(payload);
      const response = await api.post("/auth/verify_password", payload, config);
      if (response.data && response.status == 200) {
        console.log("Senha verificada");
        if (response.data.isPasswordCorrect) {
          toast.success("Senha confirmada com sucesso");
          setTimeout(() => setStep(2), 1000);
        } else {
          console.log("Senha incorreta");
          toast.error("Senha incorreta, digite novamente!");
        }
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Senha incorreta, digite novamente!");
        return;
      }

      toast.error("Erro ao verificar a senha");
      console.log(error);
    }
  };

  const handleSubmitNewPassword = async (values: { password: string }) => {
    try {
      const token = localStorage.getItem("accessToken") || null;
      if (!token) {
        console.log("Access token não encontrado no localStorage");
      }
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const payload = values;
      const response = await api.patch("/users/update_password", payload, config);
      console.log(response);
      if (response.data && response.status == 200) {
        console.log("Senha Enviada");
        toast.success("Senha atualizada com sucesso");
        setTimeout(() => setStep(0), 1000);
      }
    } catch (error) {
      console.log(error);
    }
  };

  async function beginResetPassword() {
    setStep(1);
  }
  async function updateTwoFactorAuthSettings() {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("Access token não encontrado no localStorage");
        return;
      }
      console.log("Token:", token);
      const response = await axios.patch(
        "http://localhost:3000/users/update_two_factor_auth",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 200) {
        setTwoFactor(!twoFactor);
        if (twoFactor) {
          console.log("Configurações de 2FA desativadas com sucesso:", response.data);
        } else {
          console.log("Configurações de 2FA ativadas com sucesso:", response.data);
        }
      }
      console.log("Olhe a resposta do servidor:", response.data);
    } catch (error) {
      console.error("Erro ao atualizar configurações de notificação por SMS:", error);
    }
  }
  return (
    <SettingSection icon={Lock} title="Segurança">
      <ToggleSwitch
        label="Autenticação de dois fatores"
        isOn={twoFactor}
        onToggle={() => updateTwoFactorAuthSettings()}
      />
      {step == 0 && (
        <div className="mt-4">
          <button
            onClick={() => beginResetPassword()}
            className=" cursor-pointer bg-[#da974e] hover:bg-[#D9A94E] text-[#101828] font-bold py-2 px-4 rounded transition duration-200"
          >
            Alterar Senha
          </button>
        </div>
      )}

      {step == 1 && (
        <Formik
          initialValues={{
            password: "",
          }}
          validationSchema={previousPasswordSchema}
          onSubmit={handleSubmitPreviousPassword}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col justify-center items-start min-w-full max-w-[50vw] space-y-4 rounded-lg  py-5">
              <div className="w-full">
                <h2 className="text-[#429f8d] mb-10 text-2xl font-bold">Confirmar Senha</h2>
                <div className="flex justify-center items-start gap-[20px] w-full">
                  {/* Wrapper da Senha */}
                  <div className="flex flex-col flex-1 items-start">
                    <div className="relative h-12 w-full">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder=" "
                        className={`text-[12px] lg:text-lg peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                          errors.password && touched.password ? "border-red-500" : "border-gray-100"
                        }`}
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Lock />
                      </div>
                      <label
                        htmlFor="password"
                        className={` lg:text-lg text-[12px] absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                          errors.password && touched.password ? "text-red-500" : "text-gray-100"
                        } bg-gray-800 px-1`}
                      >
                        Senha Atual
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
                </div>
              </div>

              <button
                type="submit"
                className="w-full cursor-pointer py-2 mt-3 bg-[#429f8d] hover:bg-[#33746f] text-white rounded-md transition duration-200"
              >
                Verifique Aqui!
              </button>
            </Form>
          )}
        </Formik>
      )}
      {step == 2 && (
        <Formik
          initialValues={{
            password: "",
            confirmPassword: "",
          }}
          validationSchema={newPasswordSchema}
          onSubmit={handleSubmitNewPassword}
        >
          {({ errors, touched }) => (
            <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg py-1">
              <div className="w-full">
                <h2 className="text-[#429f8d] mb-10 text-2xl font-bold">Alterar Senha</h2>
                <div className=" flex-col lg:flex-row flex justify-center items-start gap-[20px] w-full">
                  {/* Wrapper da Senha */}
                  <div className=" flex flex-col flex-1 items-start w-full">
                    <div className="relative h-12 w-full">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder=" "
                        className={`text-[12px] lg:text-lg peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                          errors.password && touched.password ? "border-red-500" : "border-gray-100"
                        }`}
                      />
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <Lock />
                      </div>
                      <label
                        htmlFor="password"
                        className={`lg:text-lg text-[12px] absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                          errors.password && touched.password ? "text-red-500" : "text-gray-100"
                        } bg-gray-800 px-1`}
                      >
                        Nova Senha
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
                        className={`text-[12px] lg:text-lg peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
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
                        className={`lg:text-lg text-[12px] absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                          errors.confirmPassword && touched.confirmPassword
                            ? "text-red-500"
                            : "text-gray-100"
                        } bg-gray-800 px-1`}
                      >
                        Confirmar Nova Senha
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
                className="w-full cursor-pointer py-2 mt-3 bg-[#429f8d] hover:bg-[#33746f] text-white rounded-md transition duration-200"
              >
                Atualizar Senha
              </button>
            </Form>
          )}
        </Formik>
      )}
    </SettingSection>
  );
};
