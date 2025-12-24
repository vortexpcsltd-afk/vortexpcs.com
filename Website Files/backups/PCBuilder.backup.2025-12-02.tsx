// Backup of PCBuilder.tsx created on 2025-12-02
// Do not modify. Used for rollback.
// --- BEGIN BACKUP CONTENT ---
import React, {
  useState,
  useEffect,
  useRef,
  memo,
  useMemo,
  useCallback,
} from "react";
import {
  documentToReactComponents,
  Options,
} from "@contentful/rich-text-react-renderer";
import { BLOCKS, INLINES, Document } from "@contentful/rich-text-types";
import { buildFullShareUrl, decodeFullBuild } from "../services/buildSharing";
import { toast } from "sonner";
import { logger } from "../services/logger";
import { ComponentErrorBoundary } from "./ErrorBoundary";
import { saveConfiguration } from "../services/database";
import { useAuth } from "../contexts/AuthContext";
import { ProductComparison } from "./ProductComparison";
import { BuildsCompletedToday } from "./SocialProof";
import {
  trackSearch,
  trackZeroResultSearch,
  trackSearchRefinement,
} from "../services/searchTracking";
import { getSessionId, trackClick } from "../services/sessionTracker";
import { getSearchSessionId } from "../utils/searchSessionManager";
import { componentData, PLACEHOLDER_IMAGE } from "./data/pcBuilderComponents";
import { peripheralsData } from "./data/pcBuilderPeripherals";
// ... content truncated in backup for brevity ...
// --- END BACKUP CONTENT ---
