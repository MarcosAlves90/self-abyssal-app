import { useCallback, useEffect, useRef, useState } from "react";
import { fetchOrders } from "../services/api";

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
  const intervalRef = useRef(null);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const all = await fetchOrders();
      setOrders(all.filter(isActiveDelivery));
    } catch {
      // silently ignore – MenuScreen still renders without orders
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      setIsLoading(true);
      try {
        const all = await fetchOrders();
        if (isMounted) setOrders(all.filter(isActiveDelivery));
      } catch {
        // noop
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  // poll while orders are active
  useEffect(() => {
    if (orders.length === 0) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL_MS);

    return () => clearInterval(intervalRef.current);
  }, [orders.length, load]);

  return { orders, isLoading, refresh: () => load(false) };
}
