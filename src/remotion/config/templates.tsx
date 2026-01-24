import React from "react";
import { ASFAT1 } from "../templates/ASFA-T1";
import { ASFAT2 } from "../templates/ASFA-T2";

export const TemplateRegistry: React.FC<any> = (props) => {
  const { templateId } = props;

  switch (templateId) {
    case "asfa-t1":
      return <ASFAT1 {...props} />;
    case "asfa-t2":
      return <ASFAT2 {...props} />;
    default:
      return (
        <div
          style={{
            flex: 1,
            backgroundColor: "black",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Unknown Template: {templateId}
        </div>
      );
  }
};
