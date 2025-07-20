import Navbar2 from "../Components/Navbar2"; 
import { Outlet } from "react-router-dom";


export default function AuthLayout() {
  return (
    <>
      <Navbar2 />
      <Outlet />
    </>
  );
}
