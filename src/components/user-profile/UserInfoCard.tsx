"use client";
import React, { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { useUser } from "@/context/UserContext";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { useToast } from "@/context/ToastContext";

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { profile, loading, updateProfile } = useUser();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Enviar campos del perfil
    const updates: Record<string, any> = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone: formData.phone,
    };

    console.log('[UserInfoCard] Enviando updates:', updates);

    const result = await updateProfile(updates);
    setSaving(false);

    if (result.success) {
      showToast("success", "Información actualizada", "Tus datos se guardaron correctamente");
      closeModal();
    } else {
      showToast("error", "Error al actualizar", result.error || "No se pudo guardar la información");
    }
  };

  if (loading) {
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full border-brand-500 animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
              Información Personal
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Nombre
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile?.first_name || "No especificado"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Apellido
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile?.last_name || "No especificado"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Correo Electrónico
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile?.email || "No especificado"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  Teléfono
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {profile?.phone || "No especificado"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Editar
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Editar Información Personal
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Actualiza tus datos personales.
            </p>
          </div>
          <form onSubmit={handleSave} className="flex flex-col">
            <div className="px-2 pb-3 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div className="col-span-2 lg:col-span-1">
                  <Label>Nombre</Label>
                  <Input
                    type="text"
                    placeholder="Tu nombre"
                    defaultValue={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Apellido</Label>
                  <Input
                    type="text"
                    placeholder="Tu apellido"
                    defaultValue={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Correo Electrónico</Label>
                  <Input
                    type="email"
                    placeholder={profile?.email || "correo@ejemplo.com"}
                    value={profile?.email ?? ""}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    El correo no se puede cambiar
                  </p>
                </div>

                <div className="col-span-2 lg:col-span-1">
                  <Label>Teléfono</Label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(value) => setFormData({ ...formData, phone: value })}
                    placeholder="Ingresa tu número"
                    defaultCountry="DO"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button type="button" size="sm" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
