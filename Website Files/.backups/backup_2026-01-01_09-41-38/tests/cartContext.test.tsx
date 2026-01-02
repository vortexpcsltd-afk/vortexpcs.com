import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "../contexts/CartContext";

function Harness() {
  const { items, total, addItem, updateQty, removeItem, clearCart } = useCart();
  return (
    <div>
      <div data-testid="count">{items.length}</div>
      <div data-testid="qty0">{items[0]?.quantity ?? 0}</div>
      <div data-testid="total">{total}</div>
      <button
        data-testid="add1"
        onClick={() =>
          addItem({
            id: "gpu-1",
            name: "GPU",
            price: 100,
            quantity: 1,
            category: "pc-component",
          })
        }
      />
      <button
        data-testid="add1-again"
        onClick={() =>
          addItem({
            id: "gpu-1",
            name: "GPU",
            price: 100,
            quantity: 1,
            category: "pc-component",
          })
        }
      />
      <button data-testid="update3" onClick={() => updateQty("gpu-1", 3)} />
      <button data-testid="remove1" onClick={() => removeItem("gpu-1")} />
      <button data-testid="clear" onClick={() => clearCart()} />
    </div>
  );
}

function renderWithProvider() {
  return render(
    <CartProvider>
      <Harness />
    </CartProvider>
  );
}

beforeEach(() => {
  try {
    localStorage.removeItem("vortex_cart_items");
  } catch {}
});

describe("CartContext flows", () => {
  it("adds item and updates total", async () => {
    const user = userEvent.setup();
    renderWithProvider();
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");

    await user.click(screen.getByTestId("add1"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("qty0").textContent).toBe("1");
    expect(screen.getByTestId("total").textContent).toBe("100");
  });

  it("increments quantity when adding same id", async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByTestId("add1"));
    await user.click(screen.getByTestId("add1-again"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("qty0").textContent).toBe("2");
    expect(screen.getByTestId("total").textContent).toBe("200");
  });

  it("updates quantity directly", async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByTestId("add1"));
    await user.click(screen.getByTestId("update3"));
    expect(screen.getByTestId("qty0").textContent).toBe("3");
    expect(screen.getByTestId("total").textContent).toBe("300");
  });

  it("removes item and clears cart", async () => {
    const user = userEvent.setup();
    renderWithProvider();
    await user.click(screen.getByTestId("add1"));
    await user.click(screen.getByTestId("remove1"));
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");

    await user.click(screen.getByTestId("add1"));
    await user.click(screen.getByTestId("clear"));
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(screen.getByTestId("total").textContent).toBe("0");
  });
});
