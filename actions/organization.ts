"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/current-user";
import { requireOrgAdmin, requireOrgMember, assertNotLastAdmin } from "@/lib/permissions";
import { toActionResult } from "@/lib/action-result";
import { AppError } from "@/lib/errors";
import { CreateOrganizationSchema, UpdateOrganizationSchema } from "@/schemas";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const getMyOrganizations = async () => {
  const user = await requireUser();

  return db.organization.findMany({
    where: { memberships: { some: { userId: user.id } } },
    orderBy: { createdAt: "asc" },
  });
};

export const getOrganizationBySlug = async (slug: string) => {
  const user = await requireUser();

  return db.organization.findFirst({
    where: { slug, memberships: { some: { userId: user.id } } },
    include: {
      memberships: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
};

// for organization-settings-modal.tsx - fetch by id, not by slug
export const getOrganizationById = async (organizationId: string) =>
  toActionResult(async () => {
    const membership = await requireOrgMember(organizationId);

    const organization = await db.organization.findUnique({ where: { id: organizationId } });
    if (!organization) throw new AppError("Team not found", 404);

    return { organization, role: membership.role };
  });

// list of org members for the members modal (must be at least MEMBER)
export const getOrganizationMembers = async (organizationId: string) =>
  toActionResult(async () => {
    await requireOrgMember(organizationId);

    const memberships = await db.membership.findMany({
      where: { organizationId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });

    const members = memberships.map((m) => ({
      userId: m.userId,
      role: m.role,
      user: { name: m.user.name, email: m.user.email },
    }));

    return { members };
  });

// create an ADDITIONAL organization (in addition to the default one, which already exists after registration)
export const createOrganization = async (values: z.infer<typeof CreateOrganizationSchema>) =>
  toActionResult(async () => {
    const validated = CreateOrganizationSchema.safeParse(values);
    if (!validated.success) return { error: "Incorrect name" };

    const user = await requireUser();
    const { name } = validated.data;
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 8)}`;

    const organization = await db.organization.create({
      data: {
        name,
        slug,
        memberships: { create: { userId: user.id, role: "ADMIN" } },
      },
    });

    return { success: "The team was created", organization };
  });

export const updateOrganization = async (values: z.infer<typeof UpdateOrganizationSchema>) =>
  toActionResult(async () => {
    const validated = UpdateOrganizationSchema.safeParse(values);
    if (!validated.success) return { error: "Incorrect data" };

    const { organizationId, name, imageUrl } = validated.data;
    await requireOrgAdmin(organizationId);

    await db.organization.update({
      where: { id: organizationId },
      data: { name, imageUrl: imageUrl ?? undefined },
    });

    return { success: "Team updated" };
  });

export const removeMember = async (organizationId: string, targetUserId: string) =>
  toActionResult(async () => {
    const membership = await requireOrgAdmin(organizationId);

    if (membership.userId === targetUserId) {
      return { error: "To leave the team, use the 'Leave Team' option." };
    }

    // The last-admin check and the delete run in one serializable transaction, so two
    // concurrent requests can't both pass the check and leave the team without an admin.
    await db.$transaction(
      async (tx) => {
        await assertNotLastAdmin(organizationId, targetUserId, tx);
        await tx.membership.delete({
          where: { userId_organizationId: { userId: targetUserId, organizationId } },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return { success: "Member removed" };
  });

export const changeMemberRole = async (
  organizationId: string,
  targetUserId: string,
  role: "ADMIN" | "MEMBER",
) =>
  toActionResult(async () => {
    await requireOrgAdmin(organizationId);

    await db.$transaction(
      async (tx) => {
        if (role === "MEMBER") await assertNotLastAdmin(organizationId, targetUserId, tx);

        await tx.membership.update({
          where: { userId_organizationId: { userId: targetUserId, organizationId } },
          data: { role },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return { success: "Role changed" };
  });

export const leaveOrganization = async (organizationId: string) =>
  toActionResult(async () => {
    const user = await requireUser();
    await requireOrgMember(organizationId);
    await db.$transaction(
      async (tx) => {
        await assertNotLastAdmin(organizationId, user.id, tx);
        await tx.membership.delete({
          where: { userId_organizationId: { userId: user.id, organizationId } },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return { success: "You left the team" };
  });

export const deleteOrganization = async (organizationId: string) =>
  toActionResult(async () => {
    await requireOrgAdmin(organizationId);

    await db.organization.delete({ where: { id: organizationId } });

    return { success: "Team deleted" };
  });
