import React from "react";
import moment from "moment";
import accountsImg from "./images/accounts.jpg"
export default function Widget() {
  return (
    <div
      style={{
        borderRadius: "4px",
        padding: "2em",
        backgroundColor: "#34568B",
        color: "white",
      }}
    >
      <h2>Accounts App</h2>
      <section className="widget-section">
        <div className="description">
          <p>
            Using <strong>momentjs</strong> for format the date
          </p>
          <p>{moment().format("MMMM Do YYYY, h:mm:ss a")}</p>
        </div>
        <div className="img-section">
          <p> <img className="img-contained" src={accountsImg} /></p>
        </div>
      </section>
    </div>
  );
}
