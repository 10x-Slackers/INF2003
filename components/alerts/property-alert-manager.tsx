"use client";

import { FormEvent, useMemo, useState } from "react";
import { DataTablePlaceholder } from "@/components/data/data-table-placeholder";
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
  storeyRange: [
    ...new Set(transactions.map((transaction) => transaction.storeyRange)),
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

  function createAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!validateForm()) return;

    const isRangeMetric = rangeMetrics.includes(metric);
    const nextAlert: PropertyAlert = {
      id: `alert-${Date.now()}`,
      propertyId,
      metric,
      matchValue: isRangeMetric ? "" : matchValue.trim(),
      minValue: isRangeMetric ? minValue : "",
      maxValue: isRangeMetric ? maxValue : "",
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const nextAlerts = [nextAlert, ...alerts];

    setAlerts(nextAlerts);
    setMessage("Property alert created.");
    setMatchValue("");
    setMinValue("");
    setMaxValue("");
    setErrors({});
  }

  function removeAlert(alertId: string) {
    const nextAlerts = alerts.filter((alert) => alert.id !== alertId);
    setAlerts(nextAlerts);
  }

  const usesRange = rangeMetrics.includes(metric);
  const metricOptions = metricValueOptions[metric] ?? [];

  function criteriaLabel(alert: PropertyAlert) {
    if (rangeMetrics.includes(alert.metric)) {
      return `${alert.minValue || "No min"} to ${alert.maxValue || "No max"}`;
    }

    return alert.matchValue;
  }

  return (
    <div className="grid gap-6">
      <form className="grid gap-4 md:grid-cols-3" onSubmit={createAlert}>
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
          onChange={(event) => updateMetric(event.target.value as AlertMetric)}
        />
        {usesRange ? (
          <>
            <FormFieldText
              label={`Minimum ${metricLabels[metric].toLowerCase()}`}
              name="minValue"
              min="0"
              type="number"
              value={minValue}
              onChange={(event) => {
                setMinValue(event.target.value);
                setErrors((current) => ({ ...current, minValue: undefined }));
              }}
              error={errors.minValue}
            />
            <FormFieldText
              label={`Maximum ${metricLabels[metric].toLowerCase()}`}
              name="maxValue"
              min="0"
              type="number"
              value={maxValue}
              onChange={(event) => {
                setMaxValue(event.target.value);
                setErrors((current) => ({ ...current, maxValue: undefined }));
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
              setErrors((current) => ({ ...current, matchValue: undefined }));
            }}
            error={errors.matchValue}
          />
        )}
        <div className="self-end">
          <SubmitButton>Create property alert</SubmitButton>
        </div>
        {message && (
          <p className="text-sm text-muted-foreground md:col-span-2">
            {message}
          </p>
        )}
      </form>

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
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => removeAlert(alert.id)}
              >
                Remove
              </Button>
            ),
          },
        ]}
        rows={alerts}
      />
    </div>
  );
}
