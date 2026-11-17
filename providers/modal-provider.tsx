"use client";

import { useEffect, useState } from "react";

import { RenameModal } from "@/components/modals/rename-modal";
import { CreateOrganizationModal } from "@/components/modals/create-organization-modal";
import { OrganizationSettingsModal } from "@/components/modals/organization-settings-modal";
import { MembersModal } from "@/components/modals/members-modal";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <RenameModal />
      <CreateOrganizationModal />
      <OrganizationSettingsModal />
      <MembersModal />
    </>
  );
};
