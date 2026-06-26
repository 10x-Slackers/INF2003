"use client";

import { FormEvent, useMemo, useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
import { ConfirmationModal } from "@/components/forms/confirmation-modal";
import {
  FormFieldSelect,
  FormFieldText,
  SubmitButton,
} from "@/components/forms/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  alertMetricOptions,
  propertyAlerts,
  transactions,
} from "@/lib/frontend/placeholders";
import type {
  AlertMetric,
  PlaceholderProperty,
  PropertyAlert,
} from "@/lib/frontend/types";

const rangeMetrics: AlertMetric[] = [
  "resalePrice",
  "floorAreaSqm",
  "leaseCommenceYear",
  "storeyRange",
];

const metricLabels = Object.fromEntries(
  alertMetricOptions.map((option) => [option.value, option.label]),
) as Record<AlertMetric, string>;

const metricValueOptions: Partial<
  Record<AlertMetric, { value: string; label: string }[]>
> = {
  flatType: [
    ...new Set(transactions.map((transaction) => transaction.flatType)),
  ].map((value) => ({ value, label: value })),
  flatModel: [
    ...new Set(transactions.map((transaction) => transaction.flatModel)),
  ].map((value) => ({ value, label: value })),
};

type AlertFormErrors = Partial<
  Record<"propertyId" | "matchValue" | "minValue" | "maxValue", string>
>;

export function PropertyAlertManager({
  initialPropertyId,
  properties,
}: {
  initialPropertyId?: string;
  properties: PlaceholderProperty[];
}) {
  const [alerts, setAlerts] = useState<PropertyAlert[]>(propertyAlerts);
  const [propertyId, setPropertyId] = useState(
    initialPropertyId ?? properties[0]?.id ?? "",
  );
  const [metric, setMetric] = useState<AlertMetric>("resalePrice");
  const [matchValue, setMatchValue] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<AlertFormErrors>({});
  const [pendingAlert, setPendingAlert] = useState<PropertyAlert | null>(null);
  const [editingAlertId, setEditingAlertId] = useState("");
  const [alertToRemove, setAlertToRemove] = useState<PropertyAlert | null>(
    null,
  );
  const [alertToToggle, setAlertToToggle] = useState<PropertyAlert | null>(
    null,
  );

  const propertyOptions = useMemo(
    () =>
      properties.map((property) => ({
        value: property.id,
        label: `${property.block} ${property.streetName}, ${property.town}`,
      })),
    [properties],
  );

  function propertyLabel(id: string) {
    const property = properties.find((item) => item.id === id);
    return property
      ? `${property.block} ${property.streetName}, ${property.town}`
      : "Unknown property";
  }

  function updateMetric(nextMetric: AlertMetric) {
    setMetric(nextMetric);
    setMatchValue("");
    setMinValue("");
    setMaxValue("");
    setErrors({});
    setMessage("");
  }

  function validateForm() {
    const nextErrors: AlertFormErrors = {};
    const isRangeMetric = rangeMetrics.includes(metric);
    const minNumber = Number(minValue);
    const maxNumber = Number(maxValue);

    if (!propertyId) {
      nextErrors.propertyId = "Choose a property.";
    }

    if (isRangeMetric) {
      if (!minValue && !maxValue) {
        nextErrors.minValue = "Enter a minimum or maximum value.";
      }

      if (minValue && Number.isNaN(minNumber)) {
        nextErrors.minValue = "Enter a valid number.";
      }

      if (maxValue && Number.isNaN(maxNumber)) {
        nextErrors.maxValue = "Enter a valid number.";
      }

      if (minValue && maxValue && minNumber > maxNumber) {
        nextErrors.maxValue = "Maximum must be greater than minimum.";
      }
    }

    if (!isRangeMetric && !matchValue.trim()) {
      nextErrors.matchValue = "Enter a value for the selected metric.";
    }

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }

  function saveAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    const isRangeMetric = rangeMetrics.includes(metric);
    const nextAlert: PropertyAlert = {
      id: editingAlertId || `alert-${Date.now()}`,
      propertyId,
      metric,
      matchValue: isRangeMetric ? "" : matchValue.trim(),
      minValue: isRangeMetric ? minValue : "",
      maxValue: isRangeMetric ? maxValue : "",
      isActive:
        alerts.find((alert) => alert.id === editingAlertId)?.isActive ?? true,
      createdAt:
        alerts.find((alert) => alert.id === editingAlertId)?.createdAt ??
        new Date().toISOString().slice(0, 10),
    };
    setPendingAlert(nextAlert);
  }

  function confirmSaveAlert() {
    if (!pendingAlert) return;

    setAlerts((current) =>
      editingAlertId
        ? current.map((alert) =>
            alert.id === pendingAlert.id ? pendingAlert : alert,
          )
        : [pendingAlert, ...current],
    );
    setMessage(
      editingAlertId ? "Property alert updated." : "Property alert created.",
    );
    setEditingAlertId("");
    setMatchValue("");
    setMinValue("");
    setMaxValue("");
    setErrors({});
    setPendingAlert(null);
  }

  function editAlert(alert: PropertyAlert) {
    setEditingAlertId(alert.id);
    setPropertyId(alert.propertyId);
    setMetric(alert.metric);
    setMatchValue(alert.matchValue);
    setMinValue(alert.minValue);
    setMaxValue(alert.maxValue);
    setErrors({});
    setMessage("Editing property alert. Submit the form to save.");
  }

  function cancelEdit() {
    setEditingAlertId("");
    setMatchValue("");
    setMinValue("");
    setMaxValue("");
    setErrors({});
    setMessage("");
  }

  function confirmRemoveAlert() {
    if (!alertToRemove) return;

    setAlerts((current) =>
      current.filter((alert) => alert.id !== alertToRemove.id),
    );
    setAlertToRemove(null);
  }

  function confirmToggleAlert() {
    if (!alertToToggle) return;

    setAlerts((current) =>
      current.map((alert) =>
        alert.id === alertToToggle.id
          ? { ...alert, isActive: !alert.isActive }
          : alert,
      ),
    );
    setMessage(
      alertToToggle.isActive
        ? "Property alert paused."
        : "Property alert activated.",
    );
    setAlertToToggle(null);
  }

  const usesRange = rangeMetrics.includes(metric);
  const metricOptions = metricValueOptions[metric] ?? [];
  const minLabel =
    metric === "storeyRange"
      ? "Minimum storey"
      : `Minimum ${metricLabels[metric].toLowerCase()}`;
  const maxLabel =
    metric === "storeyRange"
      ? "Maximum storey"
      : `Maximum ${metricLabels[metric].toLowerCase()}`;

  function criteriaLabel(alert: PropertyAlert) {
    if (rangeMetrics.includes(alert.metric)) {
      return `${alert.minValue || "No min"} to ${alert.maxValue || "No max"}`;
    }

    return alert.matchValue;
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" onSubmit={saveAlert}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormFieldSelect
            label="Property"
            name="propertyId"
            options={propertyOptions}
            value={propertyId}
            onChange={(event) => {
              setPropertyId(event.target.value);
              setErrors((current) => ({ ...current, propertyId: undefined }));
            }}
            error={errors.propertyId}
          />
          <FormFieldSelect
            label="Metric"
            name="metric"
            options={alertMetricOptions}
            value={metric}
            onChange={(event) =>
              updateMetric(event.target.value as AlertMetric)
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {usesRange ? (
            <>
              <FormFieldText
                label={minLabel}
                name="minValue"
                min="0"
                type="number"
                value={minValue}
                onChange={(event) => {
                  setMinValue(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    minValue: undefined,
                  }));
                }}
                error={errors.minValue}
              />
              <FormFieldText
                label={maxLabel}
                name="maxValue"
                min="0"
                type="number"
                value={maxValue}
                onChange={(event) => {
                  setMaxValue(event.target.value);
                  setErrors((current) => ({
                    ...current,
                    maxValue: undefined,
                  }));
                }}
                error={errors.maxValue}
              />
            </>
          ) : (
            <FormFieldSelect
              label={metricLabels[metric]}
              name="matchValue"
              options={metricOptions}
              placeholder={`Select ${metricLabels[metric].toLowerCase()}`}
              value={matchValue}
              onChange={(event) => {
                setMatchValue(event.target.value);
                setErrors((current) => ({
                  ...current,
                  matchValue: undefined,
                }));
              }}
              error={errors.matchValue}
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <SubmitButton>
            {editingAlertId ? "Update property alert" : "Create property alert"}
          </SubmitButton>
          {editingAlertId && (
            <Button type="button" variant="outline" onClick={cancelEdit}>
              Cancel edit
            </Button>
          )}
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </form>

      <ConfirmationModal
        open={Boolean(pendingAlert)}
        title={
          editingAlertId ? "Update property alert?" : "Create property alert?"
        }
        description="Confirm the alert details before saving it to your placeholder list."
        confirmLabel={editingAlertId ? "Update alert" : "Create alert"}
        items={[
          {
            label: "Property",
            value: propertyLabel(pendingAlert?.propertyId ?? ""),
          },
          {
            label: "Metric",
            value: pendingAlert ? metricLabels[pendingAlert.metric] : "",
          },
          {
            label: "Criteria",
            value: pendingAlert ? criteriaLabel(pendingAlert) : "",
          },
        ]}
        onCancel={() => setPendingAlert(null)}
        onConfirm={confirmSaveAlert}
      />
      <ConfirmationModal
        open={Boolean(alertToRemove)}
        title="Remove property alert?"
        description="Confirm before removing this placeholder alert."
        confirmLabel="Remove"
        items={[
          {
            label: "Property",
            value: propertyLabel(alertToRemove?.propertyId ?? ""),
          },
          {
            label: "Metric",
            value: alertToRemove ? metricLabels[alertToRemove.metric] : "",
          },
          {
            label: "Criteria",
            value: alertToRemove ? criteriaLabel(alertToRemove) : "",
          },
        ]}
        onCancel={() => setAlertToRemove(null)}
        onConfirm={confirmRemoveAlert}
      />
      <ConfirmationModal
        open={Boolean(alertToToggle)}
        title={
          alertToToggle?.isActive
            ? "Pause property alert?"
            : "Activate property alert?"
        }
        description="Confirm before changing this placeholder alert status."
        confirmLabel={
          alertToToggle?.isActive ? "Pause alert" : "Activate alert"
        }
        items={[
          {
            label: "Property",
            value: propertyLabel(alertToToggle?.propertyId ?? ""),
          },
          {
            label: "Metric",
            value: alertToToggle ? metricLabels[alertToToggle.metric] : "",
          },
          {
            label: "Criteria",
            value: alertToToggle ? criteriaLabel(alertToToggle) : "",
          },
          {
            label: "Current status",
            value: alertToToggle?.isActive ? "Active" : "Paused",
          },
        ]}
        onCancel={() => setAlertToToggle(null)}
        onConfirm={confirmToggleAlert}
      />

      <DataTablePlaceholder
        columns={[
          {
            key: "propertyId",
            header: "Property",
            render: (alert) => propertyLabel(alert.propertyId),
          },
          {
            key: "metric",
            header: "Metric",
            render: (alert) => metricLabels[alert.metric],
          },
          {
            key: "criteria",
            header: "Criteria",
            render: criteriaLabel,
          },
          {
            key: "isActive",
            header: "Status",
            render: (alert) => (
              <Badge variant={alert.isActive ? "secondary" : "outline"}>
                {alert.isActive ? "Active" : "Paused"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (alert) => (
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => editAlert(alert)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => setAlertToToggle(alert)}
                >
                  {alert.isActive ? "Pause" : "Activate"}
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={() => setAlertToRemove(alert)}
                >
                  Remove
                </Button>
              </div>
            ),
          },
        ]}
        rows={alerts}
      />
    </div>
  );
}
