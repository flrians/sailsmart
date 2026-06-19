"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./PdfPageModal.module.css";

const CONTEXT = 3;

interface Props {
  filename: string;
  page: number;
  onClose: () => void;
  autoScroll?: boolean;
}

// Renders one page from an already-loaded PDF document
function PdfPage({ pdfDoc, pageNumber, width }: { pdfDoc: any; pageNumber: number; width: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const estimatedHeight = Math.round(width * 1.414);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || width === 0) return;
    let cancelled = false;

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = estimatedHeight;
    const preCtx = canvas.getContext("2d")!;
    preCtx.fillStyle = "#f1f5f9";
    preCtx.fillRect(0, 0, width, estimatedHeight);

    (async () => {
      try {
        const pdfPage = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const scale = width / pdfPage.getViewport({ scale: 1 }).width;
        const viewport = pdfPage.getViewport({ scale });
        if (cancelled || !canvasRef.current) return;
        canvasRef.current.width = viewport.width;
        canvasRef.current.height = viewport.height;
        await pdfPage.render({ canvasContext: canvasRef.current.getContext("2d")!, viewport }).promise;
      } catch {
        // leave grey placeholder on error
      }
    })();

    return () => { cancelled = true; };
  }, [pdfDoc, pageNumber, width, estimatedHeight]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

// Full-screen overlay with all PDF pages and zoom controls
function PdfFullScreen({ pdfDoc, numPages, startPage, onClose }: {
  pdfDoc: any;
  numPages: number;
  startPage: number;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(1);
  const baseWidth = Math.min(window.innerWidth - 32, 800);
  const pageWidth = Math.round(baseWidth * zoom);
  const targetRef = useRef<HTMLDivElement>(null);
  const pageNumbers = Array.from(
    { length: Math.min(numPages, startPage + CONTEXT) - startPage + 1 },
    (_, i) => startPage + i
  );

  useEffect(() => {
    requestAnimationFrame(() =>
      targetRef.current?.scrollIntoView({ block: "start" })
    );
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className={styles.fullScreenOverlay}>
      <div className={styles.fullScreenHeader}>
        <button className={styles.backBtn} onClick={onClose}>← Back</button>
        <span className={styles.fullScreenLabel}>Page {startPage}</span>
        <div className={styles.zoomControls}>
          <button
            className={styles.zoomBtn}
            onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
          >−</button>
          <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
          <button
            className={styles.zoomBtn}
            onClick={() => setZoom(z => Math.min(3, parseFloat((z + 0.25).toFixed(2))))}
          >+</button>
        </div>
      </div>
      <div className={styles.fullScreenScroll}>
        {pageNumbers.map((n) => (
          <div
            key={n}
            ref={n === startPage ? targetRef : undefined}
            className={styles.fullScreenPageWrapper}
          >
            <div className={styles.pageNumber}>Page {n}</div>
            <PdfPage pdfDoc={pdfDoc} pageNumber={n} width={pageWidth} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PdfPageModal({ filename, page, onClose, autoScroll = false }: Props) {
  const [pageWidth, setPageWidth] = useState(0);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [fullScreen, setFullScreen] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageWidth(Math.min(window.innerWidth - 64, 700));
  }, []);

  useEffect(() => {
    if (pageWidth === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const pdf = await pdfjsLib.getDocument(`/${filename}`).promise;
        if (cancelled) return;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
      } catch {
        setNumPages(page + CONTEXT);
      }
    })();
    return () => { cancelled = true; };
  }, [filename, pageWidth, page]);

  useEffect(() => {
    if (numPages === null || !autoScroll) return;
    requestAnimationFrame(() =>
      targetRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
    );
  }, [numPages, autoScroll]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const start = page;
  const end = numPages !== null ? Math.min(numPages, page + CONTEXT) : page;
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <>
      {fullScreen && pdfDoc && numPages && (
        <PdfFullScreen
          pdfDoc={pdfDoc}
          numPages={numPages}
          startPage={page}
          onClose={() => setFullScreen(false)}
        />
      )}
      <div className={styles.viewer}>
        <div className={styles.header}>
          <span className={styles.pageLabel}>Page {page}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className={styles.pdfScroll}>
          {pageWidth === 0 ? (
            <div className={styles.loading}>Loading…</div>
          ) : (
            pageNumbers.map((n) => (
              <div
                key={n}
                ref={n === page ? targetRef : undefined}
                className={`${styles.pageWrapper} ${styles.pageWrapperClickable}`}
                onClick={() => setFullScreen(true)}
                title="Click to open full view"
              >
                <div className={styles.pageNumber}>Page {n}</div>
                <PdfPage pdfDoc={pdfDoc} pageNumber={n} width={pageWidth} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
