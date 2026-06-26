"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { ConfirmationModal } from "@/components/forms/confirmation-modal";
import { FormFieldSelect, FormFieldText } from "@/components/forms/form-fields";
import { Button } from "@/components/ui/button";
import { canManageTransaction } from "@/lib/auth/permissions";
import { transactions } from "@/lib/frontend/placeholders";
import type { PlaceholderTransaction } from "@/lib/frontend/types";

type TransactionForm = {
  town: string;
  month: string;
  flatType: string;
  flatModel: string;
  minStorey: string;
  maxStorey: string;
  floorAreaSqm: string;
  price: string;
};

const emptyForm: TransactionForm = {
  town: "",
  month: "",
  flatType: "",
  flatModel: "",
  minStorey: "",
  maxStorey: "",
  floorAreaSqm: "",
  price: "",
};

function storeyParts(storeyRange: string) {
  const [minStorey = "", maxStorey = ""] = storeyRange
    .split("to")
    .map((value) => value.trim());

  return { minStorey, maxStorey };
}

export function TransactionManagementTable() {
  const { data: session } = useSession();
  const [rows, setRows] = useState(transactions);
  const [search, setSearch] = useState("");
  const [town, setTown] = useState("");
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState<TransactionForm>(emptyForm);
  const [transactionToSave, setTransactionToSave] =
    useState<PlaceholderTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] =
    useState<PlaceholderTransaction | null>(null);
  const actorId =
    session?.user.role === "AGENT" ? "user-002" : session?.user.id;

  const townOptions = useMemo(
    () =>
      [...new Set(transactions.map((transaction) => transaction.town))].map(
        (value) => ({ value, label: value }),
      ),
    [],
  );

  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((transaction) => {
      const canManage = canManageTransaction(
        session?.user.role,
        actorId,
        transaction.uploadedByUserId,
      );
      const haystack =
        `${transaction.town} ${transaction.flatType} ${transaction.flatModel} ${transaction.month} ${transaction.price}`.toLowerCase();

      return (
        canManage &&
        (!town || transaction.town === town) &&
        (!query || haystack.includes(query))
      );
    });
  }, [actorId, rows, search, session?.user.role, town]);

  function startEdit(transaction: PlaceholderTransaction) {
    const { minStorey, maxStorey } = storeyParts(transaction.storeyRange);

    setEditingId(transaction.id);
    setForm({
      town: transaction.town,
      month: transaction.month,
      flatType: transaction.flatType,
      flatModel: transaction.flatModel,
      minStorey,
      maxStorey,
      floorAreaSqm: transaction.floorAreaSqm,
      price: transaction.price,
    });
    setMessage("Editing transaction. Submit the form to save.");
  }

  function cancelEdit() {
    setEditingId("");
    setForm(emptyForm);
    setMessage("");
  }

  function saveTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const current = rows.find((transaction) => transaction.id === editingId);
    if (!current) return;

    setTransactionToSave({
      ...current,
      town: form.town.toUpperCase(),
      month: form.month,
      flatType: form.flatType.toUpperCase(),
      flatModel: form.flatModel,
      storeyRange: `${form.minStorey} to ${form.maxStorey}`,
      floorAreaSqm: form.floorAreaSqm,
      price: form.price,
    });
  }

  function confirmSaveTransaction() {
    if (!transactionToSave) return;

    setRows((current) =>
      current.map((transaction) =>
        transaction.id === transactionToSave.id
          ? transactionToSave
          : transaction,
      ),
    );
    setMessage("Transaction updated in placeholder state.");
    setEditingId("");
    setForm(emptyForm);
    setTransactionToSave(null);
  }

  function confirmDeleteTransaction() {
    if (!transactionToDelete) return;

    setRows((current) =>
      current.filter(
        (transaction) => transaction.id !== transactionToDelete.id,
      ),
    );
    setMessage("Transaction deleted in placeholder state.");
    setTransactionToDelete(null);
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        <FormFieldText
          label="Search"
          name="transactionSearch"
          placeholder="Town, flat type, model, month"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <FormFieldSelect
          label="Town"
          name="transactionTown"
          options={townOptions}
          placeholder="All towns"
          value={town}
          onChange={(event) => setTown(event.target.value)}
        />
      </div>

      {editingId && (
        <form className="grid gap-3 md:grid-cols-4" onSubmit={saveTransaction}>
          <FormFieldText
            label="Town"
            name="editTown"
            value={form.town}
            onChange={(event) =>
              setForm((current) => ({ ...current, town: event.target.value }))
            }
          />
          <FormFieldText
            label="Month"
            name="editMonth"
            type="month"
            value={form.month}
            onChange={(event) =>
              setForm((current) => ({ ...current, month: event.target.value }))
            }
          />
          <FormFieldText
            label="Flat type"
            name="editFlatType"
            value={form.flatType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                flatType: event.target.value,
              }))
            }
          />
          <FormFieldText
            label="Flat model"
            name="editFlatModel"
            value={form.flatModel}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                flatModel: event.target.value,
              }))
            }
          />
          <FormFieldText
            label="Minimum storey"
            name="editMinStorey"
            min="1"
            type="number"
            value={form.minStorey}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                minStorey: event.target.value,
              }))
            }
          />
          <FormFieldText
            label="Maximum storey"
            name="editMaxStorey"
            min="1"
            type="number"
            value={form.maxStorey}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                maxStorey: event.target.value,
              }))
            }
          />
          <FormFieldText
            label="Floor area sqm"
            name="editFloorAreaSqm"
            min="1"
            step="0.01"
            type="number"
            value={form.floorAreaSqm}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                floorAreaSqm: event.target.value,
              }))
            }
          />
          <FormFieldText
            label="Resale price"
            name="editPrice"
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
          />
          <div className="flex flex-wrap gap-2 md:col-span-4">
            <Button type="submit">Update transaction</Button>
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel edit
            </Button>
          </div>
        </form>
      )}

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <ConfirmationModal
        open={Boolean(transactionToSave)}
        title="Update transaction?"
        description="Confirm the placeholder transaction details before saving."
        confirmLabel="Update transaction"
        items={[
          { label: "Town", value: transactionToSave?.town ?? "" },
          { label: "Month", value: transactionToSave?.month ?? "" },
          { label: "Flat type", value: transactionToSave?.flatType ?? "" },
          { label: "Flat model", value: transactionToSave?.flatModel ?? "" },
          { label: "Storey", value: transactionToSave?.storeyRange ?? "" },
          {
            label: "Floor area sqm",
            value: transactionToSave?.floorAreaSqm ?? "",
          },
          { label: "Resale price", value: transactionToSave?.price ?? "" },
        ]}
        onCancel={() => setTransactionToSave(null)}
        onConfirm={confirmSaveTransaction}
      />

      <ConfirmationModal
        open={Boolean(transactionToDelete)}
        title="Delete transaction?"
        description="Confirm before removing this placeholder transaction."
        confirmLabel="Delete"
        items={[
          { label: "Town", value: transactionToDelete?.town ?? "" },
          { label: "Month", value: transactionToDelete?.month ?? "" },
          { label: "Flat type", value: transactionToDelete?.flatType ?? "" },
          { label: "Flat model", value: transactionToDelete?.flatModel ?? "" },
          { label: "Storey", value: transactionToDelete?.storeyRange ?? "" },
          { label: "Resale price", value: transactionToDelete?.price ?? "" },
        ]}
        onCancel={() => setTransactionToDelete(null)}
        onConfirm={confirmDeleteTransaction}
      />

      <DataTablePlaceholder
        columns={[
          { key: "town", header: "Town" },
          { key: "month", header: "Month" },
          { key: "flatType", header: "Flat type" },
          { key: "flatModel", header: "Flat model" },
          { key: "storeyRange", header: "Storey" },
          { key: "floorAreaSqm", header: "Floor area sqm" },
          { key: "price", header: "Resale price" },
          {
            key: "actions",
            header: "Actions",
            render: (transaction) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => startEdit(transaction)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => setTransactionToDelete(transaction)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
        rows={visibleRows}
      />
    </div>
  );
}
