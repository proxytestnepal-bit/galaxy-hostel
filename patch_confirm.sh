cat components/roles/AdminView.tsx | awk '
/const \[sessionToDelete, setSessionToDelete\]/ {
    print
    print "  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, type?: \"warning\" | \"danger\" | \"info\" | \"success\"}>({"
    print "    isOpen: false,"
    print "    title: \"\","
    print "    message: \"\","
    print "    onConfirm: () => {}"
    print "  });"
    next
}
/{toastMessage && \(/ {
    print "      <ConfirmDialog "
    print "        isOpen={confirmDialog.isOpen} "
    print "        title={confirmDialog.title} "
    print "        message={confirmDialog.message} "
    print "        type={confirmDialog.type} "
    print "        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }} "
    print "        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}"
    print "      />"
    print
    next
}
{ print }
' > tmp_admin.tsx && mv tmp_admin.tsx components/roles/AdminView.tsx
