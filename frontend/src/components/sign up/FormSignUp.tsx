import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Eye, EyeClosed, User, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const validationSchema = Yup.object().shape({
    fullName: Yup.string()
        .min(2, "O nome completo deve ter pelo menos 2 caracteres")
        .required("O nome completo é obrigatório"),
    email: Yup.string()
        .email("E‑mail inválido")
        .required("O e‑mail é obrigatório"),
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmitSignup = async (values: {
        fullName: string;
        email: string;
        password: string;
        confirmPassword: string;
    }) => {

        try {
        const response = await fetch("http//localhost:3000/users",{})
        } catch(error){

        }
        toast.success("Conta criada com sucesso!", { theme: "dark" });
        navigate("/signin");
    };

    return (
        <div>
            <Formik
                initialValues={{
                    fullName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmitSignup}
            >
                {({ errors, touched }) => (
                    <Form className="flex flex-col justify-center items-center min-w-full max-w-[50vw] space-y-4 rounded-lg bg-gray-950 px-15 py-5">
                        <h2 className="text-green-600 mb-10 text-2xl font-bold">Criar Conta</h2>

                        {/* Nome completo */}
                        <div className="flex flex-col justify-center gap-[20px] items-start">
                            <div className="flex justify-center align-center gap-[20px] items-start">
                                <div className="relative">
                                    <Field
                                        type="text"
                                        name="fullName"
                                        placeholder=""
                                        className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${errors.fullName && touched.fullName
                                            ? "border-red-500"
                                            : "border-gray-100"
                                            }`}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center cursor-pointer">
                                        <User />
                                    </div>
                                    <label
                                        htmlFor="fullName"
                                        className={`absolute left-4 -top-2 text-sm font-medium transition-all duration-200 ease-in-out ${errors.fullName && touched.fullName
                                            ? "text-red-500"
                                            : "text-gray-100"
                                            } bg-gray-950 px-1`}
                                    >
                                        Nome completo
                                    </label>
                                    {errors.fullName && touched.fullName && (
                                        <div className="text-red-500 text-sm mt-1">{errors.fullName}</div>
                                    )}
                                </div>

                                {/* E‑mail */}
                                <div className="relative">
                                    <Field
                                        type="email"
                                        name="email"
                                        placeholder=""
                                        className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${errors.email && touched.email
                                            ? "border-red-500"
                                            : "border-gray-100"
                                            }`}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center cursor-pointer">
                                        <User />
                                    </div>
                                    <label
                                        htmlFor="email"
                                        className={`absolute left-4 -top-2 text-sm font-medium transition-all duration-200 ease-in-out ${errors.email && touched.email
                                            ? "text-red-500"
                                            : "text-gray-100"
                                            } bg-gray-950 px-1`}
                                    >
                                        E‑mail
                                    </label>
                                    {errors.email && touched.email && (
                                        <div className="text-red-500 text-sm mt-1">{errors.email}</div>
                                    )}
                                </div>

                            </div>

                            <div className="flex justify-center align-center gap-[20px] items-start">
                                {/* Senha */}
                                <div className="relative mt-6">
                                    <Field
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder=" "
                                        className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${errors.password && touched.password
                                            ? "border-red-500"
                                            : "border-gray-100"
                                            }`}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center cursor-pointer">
                                        <Lock />
                                    </div>
                                    <label
                                        htmlFor="password"
                                        className={`absolute left-4 -top-2 text-sm font-medium transition-all duration-200 ease-in-out ${errors.password && touched.password
                                            ? "text-red-500"
                                            : "text-gray-100"
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
                                    {errors.password && touched.password && (
                                        <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                                    )}
                                </div>

                                {/* Confirmar Senha */}
                                <div className="relative mt-6">
                                    <Field
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder=" "
                                        className={`peer w-full py-3 px-10 border rounded-md bg-transparent focus:outline-none ${errors.confirmPassword && touched.confirmPassword
                                            ? "border-red-500"
                                            : "border-gray-100"
                                            }`}
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center cursor-pointer">
                                        <Lock />
                                    </div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className={`absolute left-4 -top-2 text-sm font-medium transition-all duration-200 ease-in-out ${errors.confirmPassword && touched.confirmPassword
                                            ? "text-red-500"
                                            : "text-gray-100"
                                            } bg-gray-950 px-1`}
                                    >
                                        Confirmar Senha
                                    </label>
                                    {errors.confirmPassword && touched.confirmPassword && (
                                        <div className="text-red-500 text-sm mt-1">{errors.confirmPassword}</div>
                                    )}
                                </div>

                            </div>
                        </div>



                        <button
                            type="submit"
                            className="w-full cursor-pointer py-2 mt-3 bg-green-700 text-white rounded-md hover:bg-green-900 transition duration-200"
                        >
                            Criar Conta
                        </button>

                        <p className="mt-4">
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
