"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
// Importaciones para Supabase
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  // Estado original del tema
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  
  // Estado adicional para Supabase
  type SignUpFormData = {
    fname: string;
    lname: string;
    email: string;
    password: string;
  };

  const [formData, setFormData] = useState<SignUpFormData>({
    fname: "",
    lname: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  // Manejar cambios en el formulario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as keyof SignUpFormData]: value,
    }));
  };

  // Función para manejar el registro con Supabase
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log("1. Iniciando proceso de registro");
    
    if (!isChecked) {
      console.log("2. Error: Términos y condiciones no aceptados");
      setError("Por favor, acepta los Términos y Condiciones");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    console.log("3. Datos del formulario:", {
      email: formData.email,
      nombre: formData.fname,
      apellido: formData.lname
    });
    
    try {
      console.log("4. Enviando solicitud a Supabase auth.signUp");
      
      // Registrar el usuario con email y contraseña
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.fname,
            last_name: formData.lname,
          },
          // Asegurémonos de que la URL de redirección sea válida
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      console.log("5. Respuesta de Supabase:", {
        usuario: data?.user ? "Usuario creado" : "Usuario no creado",
        error: signUpError ? {
          mensaje: signUpError.message,
          estado: signUpError.status
        } : "Sin errores"
      });

      if (signUpError) {
        console.error("6. Error de Supabase:", signUpError);
        
        // Traducción de mensajes de error comunes
        if (signUpError.message.includes("Password should be")) {
          throw new Error("La contraseña debe tener al menos 6 caracteres");
        } else if (signUpError.message.includes("already registered")) {
          throw new Error("Este correo ya está registrado");
        } else if (signUpError.message.includes("Database error saving new user")) {
          throw new Error("Error al guardar el usuario. Verifica la configuración de Supabase.");
        } else {
          throw signUpError;
        }
      }
      
      // Si llegamos aquí, el usuario se registró correctamente
      console.log("7. Registro exitoso. El perfil será creado por el trigger de la base de datos");

      // Mostrar mensaje de éxito y redirigir
      console.log("8. Proceso completado, redirigiendo al usuario");
      alert("¡Revisa tu correo para confirmar tu cuenta!");
      router.push('/signin');
      
    } catch (err: unknown) {
      console.error("9. Error durante el registro:", err);

      let mensajeError = "Error durante el registro";

      if (err instanceof Error) {
        mensajeError = err.message || mensajeError;

        // Traducciones adicionales
        if (err.message.includes("rate limited")) {
          mensajeError = "Demasiados intentos. Por favor, intenta más tarde";
        } else if (err.message.includes("Database error")) {
          mensajeError = "Error en la base de datos. Por favor, contacta al administrador.";
        } else if (err.message.includes("Network error")) {
          mensajeError = "Error de conexión. Verifica tu conexión a internet.";
        }
      } else if (typeof err === "string") {
        mensajeError = err;
      }

      setError(mensajeError);
    } finally {
      console.log("10. Proceso de registro finalizado");
      setLoading(false);
    }
  };
  
  // Manejar registro con Google
  const handleGoogleSignUp = async () => {
    try {
      setLoading(true);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectarse con Google");
    } finally {
      setLoading(false);
    }
  };

  // Manejar registro con Twitter/X
  const handleTwitterSignUp = async () => {
    try {
      setLoading(true);
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectarse con Twitter");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="w-full max-w-md sm:pt-10 mx-auto mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Volver al inicio
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Registro
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ¡Ingresa tus datos para crear una cuenta!
            </p>
          </div>
          <div>
            {/* Mensaje de error para Supabase */}
            {error && (
              <div className="mb-4 p-3 bg-error-50 text-error-500 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5">
              <button 
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                onClick={handleGoogleSignUp}
                disabled={loading}
                type="button"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18.7511 10.1944C18.7511 9.47495 18.6915 8.94995 18.5626 8.40552H10.1797V11.6527H15.1003C15.0011 12.4597 14.4654 13.675 13.2749 14.4916L13.2582 14.6003L15.9087 16.6126L16.0924 16.6305C17.7788 15.1041 18.7511 12.8583 18.7511 10.1944Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M10.1788 18.75C12.5895 18.75 14.6133 17.9722 16.0915 16.6305L13.274 14.4916C12.5201 15.0068 11.5081 15.3666 10.1788 15.3666C7.81773 15.3666 5.81379 13.8402 5.09944 11.7305L4.99473 11.7392L2.23868 13.8295L2.20264 13.9277C3.67087 16.786 6.68674 18.75 10.1788 18.75Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.10014 11.7305C4.91165 11.186 4.80257 10.6027 4.80257 9.99992C4.80257 9.3971 4.91165 8.81379 5.09022 8.26935L5.08523 8.1534L2.29464 6.02954L2.20333 6.0721C1.5982 7.25823 1.25098 8.5902 1.25098 9.99992C1.25098 11.4096 1.5982 12.7415 2.20333 13.9277L5.10014 11.7305Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M10.1789 4.63331C11.8554 4.63331 12.9864 5.34303 13.6312 5.93612L16.1511 3.525C14.6035 2.11528 12.5895 1.25 10.1789 1.25C6.68676 1.25 3.67088 3.21387 2.20264 6.07218L5.08953 8.26943C5.81381 6.15972 7.81776 4.63331 10.1789 4.63331Z"
                    fill="#EB4335"
                  />
                </svg>
                Registrarse con Google
              </button>
              <button 
                className="inline-flex items-center justify-center gap-3 py-3 text-sm font-normal text-gray-700 transition-colors bg-gray-100 rounded-lg px-7 hover:bg-gray-200 hover:text-gray-800 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10"
                onClick={handleTwitterSignUp}
                disabled={loading}
                type="button"
              >
                <svg
                  width="21"
                  className="fill-current"
                  height="20"
                  viewBox="0 0 21 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M15.6705 1.875H18.4272L12.4047 8.75833L19.4897 18.125H13.9422L9.59717 12.4442L4.62554 18.125H1.86721L8.30887 10.7625L1.51221 1.875H7.20054L11.128 7.0675L15.6705 1.875ZM14.703 16.475H16.2305L6.37054 3.43833H4.73137L14.703 16.475Z" />
                </svg>
                Registrarse con X
              </button>
            </div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="p-2 text-gray-400 bg-white dark:bg-gray-900 sm:px-5 sm:py-2">
                  O
                </span>
              </div>
            </div>
            <form onSubmit={handleSignUp}>
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* <!-- Nombre --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Nombre<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="fname"
                      name="fname"
                      placeholder="Ingresa tu nombre"
                      value={formData.fname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {/* <!-- Apellido --> */}
                  <div className="sm:col-span-1">
                    <Label>
                      Apellido<span className="text-error-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="lname"
                      name="lname"
                      placeholder="Ingresa tu apellido"
                      value={formData.lname}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                {/* <!-- Correo electrónico --> */}
                <div>
                  <Label>
                    Correo electrónico<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Ingresa tu correo electrónico"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* <!-- Contraseña --> */}
                <div>
                  <Label>
                    Contraseña<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Ingresa tu contraseña"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                {/* <!-- Checkbox --> */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                    Al crear una cuenta, aceptas los{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      Términos y Condiciones,
                    </span>{" "}
                    y nuestra{" "}
                    <span className="text-gray-800 dark:text-white">
                      Política de Privacidad
                    </span>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div>
                  <Button 
                    className="w-full" 
                    size="sm" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Procesando..." : "Registrarse"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
