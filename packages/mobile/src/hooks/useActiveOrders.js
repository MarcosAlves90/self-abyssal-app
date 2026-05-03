import { useCallback, useEffect, useState } from "react";
import { fetchOrders, isAbortedRequest } from "../services/api";
import { useRequestManager } from "../utils/requestManager";

const TERMINAL_STATUSES = new Set(["completed", "cancelled", "failed"]);
const POLL_INTERVAL_MS = 30_000;

function isActiveDelivery(order) {
  return (
    order.fulfillmentType === "delivery" &&
    !TERMINAL_STATUSES.has(order.status)
  );
}

/**
 * Returns active (non-terminal) delivery orders and a manual refresh function.
 * Auto-polls every 30s while there are active orders.
 */
export function useActiveOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestManager = useRequestManager();

  const load = useCallback(async (showLoading = false) => {
    const controller = requestManager.start("activeOrders.load");

    if (showLoading) setIsLoading(true);
    try {
      const all = await fetchOrders({ signal: controller.signal });
      setOrders(all.filter(isActiveDelivery));
    } catch (error) {
      if (!isAbortedRequest(error)) {
        // network failures are intentionally non-blocking here
      }
    } finally {
      requestManager.finish("activeOrders.load", controller);

      if (showLoading && !controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [requestManager]);

  useEffect(() => {
    load(true);
  }, [load]);

  // poll while orders are active
  useEffect(() => {
    if (orders.length === 0) {
      return;
    }

    const intervalId = setInterval(() => load(false), POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [orders.length, load]);

  return { orders, isLoading, refresh: () => load(false) };
}
