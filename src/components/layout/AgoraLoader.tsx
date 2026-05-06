import Image from 'next/image';

export function AgoraLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[#050505] text-white">
      <div className="loader-vignette absolute inset-0" />
      <div className="relative flex flex-col items-center">
        <div className="agora-loader-mark" aria-hidden="true">
          <div className="agora-loader-ring" />
          <div className="agora-loader-scan" />
          <div className="agora-loader-node node-cleaning" />
          <div className="agora-loader-node node-repair" />
          <div className="agora-loader-node node-home" />
          <div className="agora-loader-node node-care" />
          <div className="agora-loader-core">
            <Image src="/agoratask-icon.svg" alt="" width={74} height={74} className="agora-loader-logo" priority />
          </div>
        </div>
        <div className="mt-10 text-center">
          <p className="text-3xl font-black tracking-tight">
            AGORA<span className="text-neutral-500">TASK</span>
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500">
            Trusted services loading
          </p>
          <div className="loader-progress mt-7" aria-hidden="true">
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
