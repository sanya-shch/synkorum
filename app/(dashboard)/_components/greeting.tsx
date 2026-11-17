"use client";

import { useSyncExternalStore } from "react";
import { format } from "date-fns";

const subscribe = () => () => {};

const greetingFor = (hour: number) =>
  hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

// The greeting depends on the visitor's clock, so it is computed on the client only:
// the server snapshot is a neutral fallback, which avoids a hydration mismatch.
const getSnapshot = () => {
  const now = new Date();
  return `${format(now, "EEEE, MMMM d")}|${greetingFor(now.getHours())}`;
};
const getServerSnapshot = () => "|Welcome back";

export const Greeting = ({ name }: { name: string }) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [date, greeting] = snapshot.split("|");

  return (
    <>
      <p className="h-5 text-sm font-medium text-primary">{date}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {greeting}, {name}
      </h1>
    </>
  );
};
