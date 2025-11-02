import { SignUpForm } from "@/components/sign up/FormSignUp";
import signinImg from "../assets/imgLogin.png";
import codicash from "../assets/codicash.png";

export function SignUp() {
  return (
    <div className="z-10 flex justify-between sm:gap-[25px]">
      <img src={signinImg} alt="" className="hidden flex-1 sm:block" />

      <div className="flex-3 my-auto">
        <div className=" flex flex-col items-center justify-center mx-auto">
          <img src={codicash} alt="" className="h-30 w-40 mx-auto" />
          <h2 className="text-4xl text-green-600  mt-5">CODICASH</h2>
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
