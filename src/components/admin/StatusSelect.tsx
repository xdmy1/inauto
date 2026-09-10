"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStatusAction } from "@/app/(admin)/admin/actions";
import { Select } from "@/components/ui/Select";
import { STATUSES } from "@/lib/cars";

export function StatusSelect({
  carId,
  status,
}: {
  carId: string;
  status: string;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(next: string) {
    setValue(next);
    const fd = new FormData();
    fd.set("carId", carId);
    fd.set("status", next);
    startTransition(async () => {
      await setStatusAction(fd);
      router.refresh();
    });
  }

  return (
    <div className={`w-36 ${pending ? "opacity-60" : ""}`}>
      <Select
        value={value}
        onChange={change}
        options={STATUSES.map((s) => ({ value: s, label: s }))}
      />
    </div>
  );
}
