import { notFound } from "next/navigation";

// any URL that no real route matched renders the designed 404
export default function CatchAll() {
  notFound();
}
