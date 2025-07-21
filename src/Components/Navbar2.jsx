import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
function Navbar2() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex">
        <div className="fixed w-full transform z-50">
          <nav className="bg-white/70 md:bg-transparent text-black md:text-white px-6 md:px-20 py-7 min-w-[300px] md:min-w-[700px]">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <span
                  className="font-medium text-black md:text-white text-lg block md:hidden"
                  style={{ fontFamily: "Sora, sans-serif" }}
                >
                  SEHİR ASİSTANIM
                </span>
              </div>

              {/* Masaüstü linkler */}
              <div className="hidden md:flex items-center space-x-8 text-md font-medium">
                <Link to="/girisyap" className="hover:text-orange-500 transition text-black">
                  Giriş Yap
                </Link>
                <Link
                  to="/kayitol"
                  className="text-white bg-orange-500 px-4 py-1 rounded-full hover:bg-gray-800 transition"
                >
                  Kayıt Ol
                </Link>
              </div>

              {/* Mobil hamburger butonu */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-black focus:outline-none"
                >
                  {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
              </div>
            </div>

            {/* Mobil menü içeriği */}
            <div
              className={`flex md:hidden overflow-hidden justify-center transition-all duration-300 ease-in-out ${isOpen ? "max-h-40 mt-4" : "max-h-0"
                }`}
            >
              <div className="bg-orange-500/20 rounded-lg backdrop-blur-sm px-4 py-3 w-full">
                <div className="flex flex-col items-center gap-3">
                  <Link to="/girisyap" className="text-black hover:text-gray-700 transition">
                    Giriş Yap
                  </Link>
                   <Link to="/kayitol" className="text-black hover:underline">
              Kayıt Ol
            </Link>
                </div>
              </div>
            </div>

          </nav>
        </div>
      </div>
    </>
  );
}

export default Navbar2;
