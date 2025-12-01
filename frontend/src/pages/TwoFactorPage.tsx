import { TwoFactorForm } from "@/components/2fa/FormTwoFactor";
import signinImg from "../assets/imgLogin.png";
import codicash from "../assets/codicash.png";

export function TwoFactorPage() {
  return (
    <div className=" w-full flex flex-row justify-center z-10 items-center px-[100px]">
      <div className="hidden sm:block flex sm:items-center sm:justify-center sm:my-auto sm:w-[40vw]">
        <img src={signinImg} alt="Financial Control Illustration " className="sm:flex w-[50%] " />
      </div>

      <div className=" w-[60vw] flex flex-col justify-center my-auto sm:flex-2">
        <div className=" w-[100%] flex flex-col items-center justify-center mx-auto">
          <img src={codicash} alt="codicash logo" className="h-30 w-40 mx-auto" />
          <h2 className="text-4xl text-green-600  mt-5">CODICASH</h2>
          <TwoFactorForm />
        </div>
      </div>
    </div>
  );
}
