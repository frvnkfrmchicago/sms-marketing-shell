import { MainLayout } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { Users, Upload, Plus, Search, UserX } from "lucide-react";
import Link from "next/link";

type Contact = {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  optedOut: boolean;
  createdAt: Date;
};

async function getContacts(search?: string) {
  const where = search
    ? {
        OR: [
          { phone: { contains: search } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const contacts = await db.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const total = await db.contact.count();
  const optedOut = await db.contact.count({ where: { optedOut: true } });

  return { contacts, total, optedOut };
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const { contacts, total, optedOut } = await getContacts(search);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Contacts
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {total} contacts • {optedOut} opted out
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/contacts/import">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Link>
            </Button>
            <Button asChild>
              <Link href="/contacts/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Link>
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <form className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  name="search"
                  placeholder="Search by name, phone, or email..."
                  defaultValue={search}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {/* Contacts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No contacts yet
                </h3>
                <p className="mt-2 text-gray-500">
                  Import a CSV or add contacts manually.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <Button asChild variant="outline">
                    <Link href="/contacts/import">Import CSV</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/contacts/new">Add Contact</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-gray-500 dark:border-gray-800">
                      <th className="pb-3 pr-4">Contact</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-800">
                    {contacts.map((contact: Contact) => (
                      <tr
                        key={contact.id}
                        className={contact.optedOut ? "opacity-50" : ""}
                      >
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {contact.firstName?.[0] ||
                                contact.lastName?.[0] ||
                                contact.phone[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {contact.firstName || contact.lastName
                                  ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-4 font-mono text-sm text-gray-600 dark:text-gray-400">
                          {contact.phone}
                        </td>
                        <td className="py-4 pr-4 text-sm text-gray-600 dark:text-gray-400">
                          {contact.email || "—"}
                        </td>
                        <td className="py-4 pr-4">
                          {contact.optedOut ? (
                            <Badge variant="destructive" className="gap-1">
                              <UserX className="h-3 w-3" />
                              Opted Out
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">
                              Active
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 pr-4 text-sm text-gray-500">
                          {new Date(contact.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
