import moment from "moment";
import React from "react";
import paymentsImage from "./images/payments.jpg"

export default function Widget() {
  return (
    <div
      style={{
        borderRadius: "4px",
        padding: "2em",
        backgroundColor: "#FF6F61",
        color: "white",
      }}
    >
      <h2>Payments App</h2>
      <section className="widget-section">
        <div className="description">
          <p>
            Using <strong>momentjs</strong> for format the date
          </p>
          <p>{moment().format("MMMM Do YYYY, h:mm:ss a")}</p>
        </div>
        <div className="img-section">
          <p> <img className="img-contained" src={paymentsImage} /></p>
        </div>
      </section>

    </div>
  );
}
