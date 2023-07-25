import Script from "next/script";
import "./page.css";

function Page() {
  return (
    <>
      <div id="game">
        <canvas id="mainCanvas" width="256" height="224">
          No Canvas Support
        </canvas>
      </div>
      <div id="controller">
        <div id="controller_dpad">
          <div id="controller_left"></div>
          <div id="controller_right"></div>
          <div id="controller_up"></div>
          <div id="controller_down"></div>
        </div>
        <div id="controller_select" className="capsuleBtn">
          Select
        </div>
        <div id="controller_start" className="capsuleBtn">
          Start
        </div>
        <div id="controller_b" className="roundBtn">
          B
        </div>
        <div id="controller_a" className="roundBtn">
          A
        </div>
      </div>
      <Script src="/gbstudio/binjgb.js" strategy="lazyOnload" />
      <Script src="/gbstudio/script.js" strategy="lazyOnload" />
    </>
  );
}

export default Page;
