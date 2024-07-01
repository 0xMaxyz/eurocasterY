// import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
// import { useEffect, FC } from "react";

// const LoginWrapper: FC = () => {
//   const CustomInnerButton = () => {
//     return <span style={{ color: "white" }}>Log in</span>;
//   };
//   useEffect(() => {
//     const interval = setInterval(() => {
//       const shadowRoot = document.querySelector(
//         ".dynamic-widget__container"
//       )?.shadowRoot;
//       if (shadowRoot) {
//         const button = shadowRoot.querySelector(
//           ".button"
//         ) as HTMLButtonElement | null;
//         if (button) {
//           button.style.backgroundColor = "black";
//           button.style.color = "white";
//           button.style.height = "40px";
//           button.style.borderRadius = `${button.offsetHeight / 2}px`; // Set border-radius to half the height for a circular effect
//           clearInterval(interval); // Stop checking once the button is found and updated
//         }
//       }
//     }, 100);
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <DynamicWidget
//       innerButtonComponent={<CustomInnerButton />}
//       buttonClassName="login-button"
//     />
//   );
// };

// export default LoginWrapper;

// components/LoginWrapper.tsx
import { DynamicWidget, useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useEffect, FC } from "react";

const LoginWrapper: FC = () => {
  const { setShowAuthFlow } = useDynamicContext();

  const CustomInnerButton = () => {
    return (
      <button
        onClick={() => setShowAuthFlow(true)}
        style={{ background: "none", border: "none", color: "inherit" }}
      >
        Log in
      </button>
    );
  };

  return (
    <DynamicWidget
      innerButtonComponent={<CustomInnerButton />}
      buttonClassName="login-button"
    />
  );
};

export default LoginWrapper;
