cat components/roles/AdminView.tsx | awk '
/^[ \t]*return \([ \t]*$/ {
    print
    print "      {dialogsPortal}"
    next
}
{ print }
' > tmp_admin.tsx && mv tmp_admin.tsx components/roles/AdminView.tsx
