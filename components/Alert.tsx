import { XCircleIcon } from "@heroicons/react/20/solid";
import { Transition } from "@headlessui/react";

type AlertProps = {
  showAlert: boolean;
  message: {
    title: string;
    items: string[];
  };
};

function Alert({ showAlert, message }: AlertProps) {
  return (
    <Transition
      show={showAlert}
      enter="transform transition-all duration-500 ease-in-out"
      enterFrom="translate-y-full opacity-0"
      enterTo="translate-y-0 opacity-100"
      leave="transform transition-all duration-500 ease-in-out"
      leaveFrom="translate-y-0 opacity-100"
      leaveTo="translate-y-full opacity-0"
    >
      <div className="rounded-md bg-red-50 p-4 fixed bottom-0 left-1/2 transform -translate-x-1/2 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {message.title}
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <ul role="list" className="list-disc space-y-1 pl-5">
                {message.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  );
}

export default Alert;
