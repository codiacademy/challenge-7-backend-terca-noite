import { User } from "lucide-react";
import { SettingSection } from "./SettingSection";
import { ProfileConfigsType } from "../../types/types";
import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import api from "../../api/axios-client.ts";
import { toast } from "react-toastify";
import { Mail } from "lucide-react";
import { Phone } from "lucide-react";

// formata telefone no padrão (XX) XXXXX XXXX

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
const phoneRegex = /^\+?\d{10,15}$/;

const validationSchema = Yup.object().shape({
  fullName: Yup.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  telephone: Yup.string()
    .nullable()
    .test(
      "is-valid-phone",
      "Número de telefone inválido",
      (value) => !value || value.trim() === "" || phoneRegex.test(value),
    ),
  email: Yup.string().email("E-mail inválido").optional(),
});
export const Profile = ({ user, isLoading }: { user: ProfileConfigsType; isLoading: boolean }) => {
  const [isEnabledProfileInput, setIsEnabledProfileInput] = useState<Boolean>(false);
  function enableProfileInput() {
    setIsEnabledProfileInput(true);
  }
  function disableProfileInput() {
    setIsEnabledProfileInput(false);
  }

  const handleSubmitUpdateProfile = async (values: {
    fullName: string;
    email: string;
    telephone: string;
  }) => {
    try {
      // envia telefone sem formatação (apenas dígitos)
      const payload: any = {};

      if (values.fullName.trim() !== "") payload.fullName = values.fullName;
      if (values.email.trim() !== "") payload.email = values.email;

      if (values.telephone.trim() !== "") {
        payload.telephone = unformatPhone(values.telephone); // <-- CORRETO AQUI
      }
      const token = localStorage.getItem("accessToken") || null;
      if (!token) {
        console.log("Access token não encontrado no localStorage");
      }
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const response = await api.patch(
        "http://localhost:3000/users/update_profile",
        payload,
        config,
      );
      console.log(response.data);
      if (response.data && response.status === 200) {
        toast.success("Dados atualizados com sucesso!", { theme: "dark" });
        setTimeout(() => {
          disableProfileInput();
          window.location.reload();
        }, 1000);
        console.log("Dados atualizados:", response.data);
      } else {
        toast.error("Erro ao atualizar dados da conta!", { theme: "dark" });
      }
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoading || !user) {
    return (
      <SettingSection icon={User} title="Perfil">
        <p>Carregando...</p>
      </SettingSection>
    );
  }
  console.log("Renderizando perfil com dados:", user);
  return (
    <SettingSection icon={User} title="Perfil">
      <div className="flex flex-col sm:flex-row items-center gap-5 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">{user.name}</h3>
          <p className="text-gray-400">{user.email}</p>
          <p className="text-gray-400">{user.telephone}</p>
        </div>
      </div>
      {isEnabledProfileInput && (
        <div className="mb-6">
          <Formik
            initialValues={{
              fullName: "",
              email: "",
              telephone: "",
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmitUpdateProfile}
          >
            {({ errors, touched }) => (
              <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg px-[15px] py-5">
                <h2 className="text-green-600 mb-10 text-2xl font-bold">Atualizar Dados</h2>

                {/* Nome completo */}
                <div className="flex flex-col justify-center gap-[20px] items-start w-full">
                  <div className="flex justify-center items-start gap-[20px] w-full">
                    {/* Wrapper do Nome */}
                    <div className="flex flex-col flex-1 items-start">
                      <div className="relative h-12 w-full">
                        <Field
                          type="text"
                          name="fullName"
                          placeholder=""
                          className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${
                            errors.fullName && touched.fullName
                              ? "border-red-500"
                              : "border-gray-100"
                          }`}
                        />
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <User />
                        </div>
                        <label
                          htmlFor="fullName"
                          className={`absolute left-4 -top-2 sm:text-[10px] lg:text-sm font-medium transition-all duration-200 ease-in-out ${
                            errors.fullName && touched.fullName ? "text-red-500" : "text-gray-100"
                          } bg-gray-800 px-1`}
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
                    <div className="flex flex-col flex-1 items-start">
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
                          } bg-gray-800 px-1`}
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

                  <div className="w-full flex justify-center items-start gap-[20px]">
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
                                errors.telephone && touched.telephone
                                  ? "text-red-500"
                                  : "text-gray-100"
                              } bg-gray-800 px-1`}
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
                </div>

                <button
                  type="submit"
                  className="w-full cursor-pointer py-2 mt-3 bg-[#429f8d] hover:bg-[#33746f] text-white rounded-md transition duration-200"
                >
                  Salvar Alterações
                </button>
              </Form>
            )}
          </Formik>
        </div>
      )}

      <button
        onClick={() => enableProfileInput()}
        className="cursor-pointer bg-[#da974e] hover:bg-[#D9A94E] text-white font-bold py-2 px-4 rounded transition duration-200 w-full sm:w-auto"
      >
        Editar Perfil
      </button>
    </SettingSection>
  );
};
