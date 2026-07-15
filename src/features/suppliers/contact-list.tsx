"use client";

import { Mail, Phone, Smartphone, Briefcase, Star, Plus, Trash2 } from "lucide-react";
import {
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";
import { Panel, Stack } from "@/components/layout";
import type { ContactDTO } from "./types";

interface Props {
  contacts: ContactDTO[];
  supplierId: string;
  onAdd?: () => void;
  onDelete?: (id: string) => void;
}

export function ContactList({ contacts, onAdd, onDelete }: Props) {
  return (
    <Stack gap={3}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="text-muted-foreground size-4" />
          <span className="text-foreground text-sm font-medium">Contacts</span>
          <Badge variant="secondary" size="sm">
            {contacts.length}
          </Badge>
        </div>
        {onAdd && (
          <Button variant="secondary" size="sm" onClick={onAdd}>
            <Plus className="mr-1 size-3" />
            Add
          </Button>
        )}
      </div>
      {contacts.length === 0 ? (
        <Panel padding="md" className="text-muted-foreground text-center text-sm">
          No contacts recorded.
        </Panel>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              {onDelete && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.isPrimary && <Star className="text-warning size-3" />}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">{contact.jobTitle ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground text-xs">{contact.department ?? "—"}</span>
                </TableCell>
                <TableCell>
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors"
                    >
                      <Mail className="size-3" />
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {contact.phone || contact.mobilePhone ? (
                    <div className="flex items-center gap-1 text-xs">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <Phone className="size-3" />
                          {contact.phone}
                        </a>
                      )}
                      {contact.mobilePhone && (
                        <a
                          href={`tel:${contact.mobilePhone}`}
                          className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                        >
                          <Smartphone className="size-3" />
                          {contact.mobilePhone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                {onDelete && (
                  <TableCell>
                    <button
                      onClick={() => onDelete(contact.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
