import { LoginForm } from "@/components/login/FormLogin";
import signinImg from "../assets/imgLogin.png";
import codicash from "../assets/codicash.png";

export function Login() {
  return (
    <div className="z-10 flex sm:gap-25">
      <img src={signinImg} alt="" className="hidden sm:block" />

      <div className="my-auto">
        <div className="mx-auto">
          <img src={codicash} alt="" className="h-30 w-40 mx-auto" />
          <h2 className="text-4xl text-green-600 ml-30 mt-5">CODICASH</h2>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
