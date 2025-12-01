import signinImg from "../assets/imgLogin.png";
import codicash from "../assets/codicash.png";
import { ResetPasswordForm } from "../components/reset password/FormResetPassword";

export function ResetPassword() {
  return (
    <div className="flex justify-center items-center flex-row w-full z-10 flex sm:gap-25">
      <img src={signinImg} alt="" className="w-[50%] hidden min-[1400px]:block" />

      <div className="flex justify-center items-center flex-col w-[100%] min-[1400px]:w-[30%]">
        <div className="flex justify-center items-center flex-col">
          <img src={codicash} alt="" className="h-30 w-40 mx-auto" />
          <h2 className="text-4xl text-green-600 mt-5 text-center">CODICASH</h2>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  );
}
