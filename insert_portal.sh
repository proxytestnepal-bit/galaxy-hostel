cat components/roles/AdminView.tsx | awk '
/const selectedClassData = state.systemClasses.find/ {
    print "  const dialogsPortal = typeof document !== \"undefined\" ? import(\"react-dom\").then((ReactDOM) => ReactDOM.createPortal("
    print "    <>"
    print "      <ConfirmDialog "
    print "        isOpen={confirmDialog.isOpen} "
    print "        title={confirmDialog.title} "
    print "        message={confirmDialog.message} "
    print "        type={confirmDialog.type} "
    print "        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, isOpen: false })); }} "
    print "        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}"
    print "      />"
    print "      {toastMessage && ("
    print "        <div className={\`fixed bottom-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 text-white transform transition-all duration-300 translate-y-0 opacity-100 \${"
    print "          toastMessage.type === \"success\" ? \"bg-green-600\" : \"bg-red-600\""
    print "        }\`}>"
    print "          {toastMessage.type === \"success\" ? ("
    print "            <Check className=\"w-5 h-5\" />"
    print "          ) : ("
    print "            <AlertTriangle className=\"w-5 h-5\" />"
    print "          )}"
    print "          <p className=\"font-medium text-sm\">{toastMessage.message}</p>"
    print "          <button onClick={() => setToastMessage(null)} className=\"ml-2 hover:opacity-80\">"
    print "            <X className=\"w-4 h-4\" />"
    print "          </button>"
    print "        </div>"
    print "      )}"
    print "    </>,"
    print "    document.body"
    print "  )) : null;"
    print ""
    print $0
    next
}
{ print }
' > tmp_admin.tsx && mv tmp_admin.tsx components/roles/AdminView.tsx
