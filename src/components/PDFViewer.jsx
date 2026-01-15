import React, { useEffect, useRef } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url";

GlobalWorkerOptions.workerSrc = workerSrc;

const PDFViewer = ({ fileUrl }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!fileUrl) return;

    const renderPDF = async () => {
      containerRef.current.innerHTML = ""; // Clear container

      const pdf = await getDocument(fileUrl).promise;

      const pagePromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(pdf.getPage(i));
      }

      const pages = await Promise.all(pagePromises);

      for (const page of pages) {
        const viewport = page.getViewport({ scale: 1.2 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.className = "mb-4 mx-auto";

        await page.render({ canvasContext: context, viewport }).promise;
        containerRef.current.appendChild(canvas);
      }
    };

    renderPDF();
  }, [fileUrl]);

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto h-full p-4 bg-white"
    />
  );
};

export default PDFViewer;
