import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock firebase config to avoid initializing real app
vi.mock("../config/firebase", () => ({ db: {} }));

// Define spies and classes in a hoisted context so they are available in the mock factory
const hoisted = vi.hoisted(() => {
  const addDocSpy = vi.fn();
  const getDocSpy = vi.fn();
  const updateDocSpy = vi.fn();
  const collectionSpy = vi.fn((db, path) => ({ db, path }));

  class MockTimestamp {
    static now() {
      return new MockTimestamp();
    }
    toDate() {
      return new Date();
    }
  }

  return { addDocSpy, getDocSpy, updateDocSpy, collectionSpy, MockTimestamp };
});

vi.mock("firebase/firestore", () => ({
  collection: hoisted.collectionSpy,
  addDoc: hoisted.addDocSpy,
  getDoc: hoisted.getDocSpy,
  updateDoc: hoisted.updateDocSpy,
  Timestamp: hoisted.MockTimestamp,
  doc: vi.fn((db, path, id) => ({ db, path, id })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
}));

import {
  createSupportTicket,
  addSupportTicketMessage,
} from "../services/database";

describe("Support tickets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a ticket and returns id", async () => {
    hoisted.addDocSpy.mockResolvedValueOnce({ id: "ticket-123" });

    const id = await createSupportTicket({
      name: "Test User",
      email: "test@example.com",
      subject: "Help",
      message: "I need assistance",
      type: "support",
      userId: "user-1",
    });

    expect(id).toBe("ticket-123");
    expect(hoisted.collectionSpy).toHaveBeenCalledWith({}, "support_tickets");
    expect(hoisted.addDocSpy).toHaveBeenCalledTimes(1);
    const payload = hoisted.addDocSpy.mock.calls[0][1];
    expect(payload.name).toBe("Test User");
    expect(payload.email).toBe("test@example.com");
    expect(payload.subject).toBe("Help");
    expect(payload.type).toBe("support");
    expect(payload.status).toBe("open");
    expect(Array.isArray(payload.messages)).toBe(true);
    expect(payload.messages.length).toBe(1);
    expect(payload.createdAt).toBeInstanceOf(hoisted.MockTimestamp);
  });

  it("appends a message to an existing ticket", async () => {
    // Mock existing document with no messages
    hoisted.getDocSpy.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ messages: [] }),
    });
    hoisted.updateDocSpy.mockResolvedValueOnce(undefined);

    await addSupportTicketMessage("ticket-123", {
      senderId: "admin-1",
      senderName: "Admin",
      body: "We are on it",
      internal: false,
    });

    expect(hoisted.getDocSpy).toHaveBeenCalledTimes(1);
    expect(hoisted.updateDocSpy).toHaveBeenCalledTimes(1);
    const update = hoisted.updateDocSpy.mock.calls[0][1];
    expect(Array.isArray(update.messages)).toBe(true);
    expect(update.messages.length).toBe(1);
    expect(update.updatedAt).toBeInstanceOf(hoisted.MockTimestamp);
  });
});
