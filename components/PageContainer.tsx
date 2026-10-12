"use client";

type PageContainerProps = {
  children: React.ReactNode;
};

export default function PageContainer({
  children,
}: PageContainerProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#0f172a",
        padding: "28px 30px 50px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1700px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {children}
      </div>
    </main>
  );
}