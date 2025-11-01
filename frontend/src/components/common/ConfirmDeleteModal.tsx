import Swal from "sweetalert2";

interface ConfirmDeleteModalProps {
  children: React.ReactNode;
  onConfirm: () => void;
  title?: string;
  text?: string;
}

export const ConfirmDeleteModal = ({
  children,
  onConfirm,
  title,
  text,
}: ConfirmDeleteModalProps) => {
  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton:
        "cursor-pointer bg-blue-500 transition duration-200 text-white px-4 py-2 rounded-md hover:bg-blue-900 ml-5",
      cancelButton:
        "cursor-pointer bg-red-500 transition duration-200 text-white px-4 py-2 rounded-md hover:bg-red-900",
    },
    buttonsStyling: false,
  });

  const handleDeleteClick = () => {
    swalWithBootstrapButtons
      .fire({
        background: "#363636",
        color: "#fff",
        title: title,
        text: text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Não, cancelar!",
        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          onConfirm();
          swalWithBootstrapButtons.fire({
            background: "#363636",
            color: "#fff",
            title: "Excluído!",
            text: "Exclusão realizada com sucesso.",
            icon: "success",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            background: "#363636",
            color: "#fff",
            title: "Cancelado",
            text: "Seus dados foram salvos.",
            icon: "error",
          });
        }
      });
  };

  return <button onClick={handleDeleteClick}>{children}</button>;
};
