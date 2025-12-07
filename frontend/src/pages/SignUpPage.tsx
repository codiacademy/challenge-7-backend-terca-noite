import { SignUpForm } from "@/components/sign up/FormSignUp";
import signinImg from "../assets/Hero.png";
import codicash from "../assets/Logo Codi Cash.svg";

export function SignUp() {
  return (
    <div className="flex justify-center items-center flex-row w-full z-10 flex sm:gap-25">
      <img src={signinImg} alt="" className="w-[40%] hidden min-[1400px]:block" />

      <div className="h-full flex justify-center items-center flex-col w-[100%] min-[1400px]:w-[30%] gap-[20px]">
        <div className="flex justify-center items-center flex-col">
          <img src={codicash} alt="" className="h-[300px] mx-auto" />
        </div>

        <SignUpForm />
      </div>
    </div>
  );
}
